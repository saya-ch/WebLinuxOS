import { useState, useEffect, useCallback, memo } from 'react'
import {
  Globe,
  Clock,
  Search,
  Plus,
  X,
  ArrowRightLeft,
  MapPin,
  Sun,
  Moon,
  Trash2,
  RotateCcw,
} from 'lucide-react'

// ── 数据定义 ──────────────────────────────────────────────

interface CityEntry {
  id: string
  city: string
  country: string
  timezone: string
  emoji: string
  custom?: boolean
}

const DEFAULT_CITIES: CityEntry[] = [
  { id: 'newyork', city: 'New York', country: 'USA', timezone: 'America/New_York', emoji: '🗽' },
  { id: 'london', city: 'London', country: 'UK', timezone: 'Europe/London', emoji: '🇬🇧' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', emoji: '🗼' },
  { id: 'shanghai', city: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai', emoji: '🇨🇳' },
  { id: 'paris', city: 'Paris', country: 'France', timezone: 'Europe/Paris', emoji: '🗼' },
  { id: 'sydney', city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', emoji: '🦘' },
  { id: 'dubai', city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai', emoji: '🏙️' },
  { id: 'mumbai', city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', emoji: '🇮🇳' },
  { id: 'saopaulo', city: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo', emoji: '🇧🇷' },
  { id: 'losangeles', city: 'Los Angeles', country: 'USA', timezone: 'America/Los_Angeles', emoji: '🌴' },
  { id: 'singapore', city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', emoji: '🇸🇬' },
  { id: 'berlin', city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', emoji: '🇩🇪' },
]

const ALL_TIMEZONES: Record<string, string> = {
  'America/New_York': 'New York',
  'America/Los_Angeles': 'Los Angeles',
  'America/Chicago': 'Chicago',
  'America/Toronto': 'Toronto',
  'America/Sao_Paulo': 'São Paulo',
  'America/Argentina/Buenos_Aires': 'Buenos Aires',
  'America/Mexico_City': 'Mexico City',
  'America/Denver': 'Denver',
  'Europe/London': 'London',
  'Europe/Paris': 'Paris',
  'Europe/Berlin': 'Berlin',
  'Europe/Moscow': 'Moscow',
  'Europe/Istanbul': 'Istanbul',
  'Europe/Rome': 'Rome',
  'Europe/Madrid': 'Madrid',
  'Europe/Amsterdam': 'Amsterdam',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Shanghai': 'Shanghai',
  'Asia/Kolkata': 'Mumbai',
  'Asia/Dubai': 'Dubai',
  'Asia/Singapore': 'Singapore',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Seoul': 'Seoul',
  'Asia/Bangkok': 'Bangkok',
  'Asia/Taipei': 'Taipei',
  'Australia/Sydney': 'Sydney',
  'Australia/Melbourne': 'Melbourne',
  'Pacific/Auckland': 'Auckland',
  'Pacific/Honolulu': 'Honolulu',
  'Africa/Cairo': 'Cairo',
  'Africa/Lagos': 'Lagos',
  'Africa/Johannesburg': 'Johannesburg',
}

// ── 工具函数 ──────────────────────────────────────────────

function getTimeParts(tz: string, date: Date) {
  try {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, hourCycle: 'h23', weekday: 'short',
    })
    const p = f.formatToParts(date)
    const g = (t: string) => p.find(x => x.type === t)?.value ?? '0'
    const h = parseInt(g('hour'))
    return {
      hours: h, minutes: parseInt(g('minute')), seconds: parseInt(g('second')),
      year: parseInt(g('year')), month: parseInt(g('month')), day: parseInt(g('day')),
      weekday: g('weekday'), isDaytime: h >= 6 && h < 18,
    }
  } catch {
    return { hours: 0, minutes: 0, seconds: 0, year: 2026, month: 1, day: 1, weekday: 'Sun', isDaytime: false }
  }
}

function getOffsetLabel(tz: string, date: Date): string {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
    const p = f.formatToParts(date)
    return p.find(x => x.type === 'timeZoneName')?.value ?? ''
  } catch { return '' }
}

function calcHourDiff(tzA: string, tzB: string, date: Date): number {
  const getOffsetMinutes = (tz: string) => {
    const local = new Date(date.toLocaleString('en-US', { timeZone: tz }))
    const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
    return (local.getTime() - utc.getTime()) / 60000
  }
  return Math.round((getOffsetMinutes(tzB) - getOffsetMinutes(tzA)) / 60)
}

function pad(n: number) { return String(n).padStart(2, '0') }

// ── 子组件 ──────────────────────────────────────────────

const AnalogClock = memo(({ seconds, minutes, hours, accent }: {
  seconds: number; minutes: number; hours: number; accent: string
}) => {
  const s = 140
  const cx = s / 2, cy = s / 2, r = s / 2 - 6
  const hourAngle = ((hours % 12) + minutes / 60) * 30
  const minAngle = (minutes + seconds / 60) * 6
  const secAngle = seconds * 6

  const hand = (angle: number, len: number, w: number, color: string) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x2: cx + len * Math.cos(rad), y2: cy + len * Math.sin(rad), stroke: color, strokeWidth: w }
  }

  return (
    <svg viewBox={`0 0 ${s} ${s}`} style={{ width: s, height: s }}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(0,0,0,0.3)" stroke={accent} strokeWidth="1.5" opacity={0.8} />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 - 90) * Math.PI / 180
        const main = i % 5 === 0
        const ir = r - (main ? 10 : 5)
        return <line key={i} x1={cx + ir * Math.cos(a)} y1={cy + ir * Math.sin(a)}
          x2={cx + (r - 2) * Math.cos(a)} y2={cy + (r - 2) * Math.sin(a)}
          stroke={main ? accent : 'rgba(255,255,255,0.2)'} strokeWidth={main ? 2 : 0.5} />
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180
        const nr = r - 22
        return <text key={i} x={cx + nr * Math.cos(a)} y={cy + nr * Math.sin(a)}
          fill={accent} fontSize="8" textAnchor="middle" dominantBaseline="central"
          fontFamily="monospace" fontWeight="bold">
          {i === 0 ? 12 : i}
        </text>
      })}
      <line x1={cx} y1={cy} {...hand(hourAngle, r * 0.5, 3.5, '#e0e0e0')} strokeLinecap="round" />
      <line x1={cx} y1={cy} {...hand(minAngle, r * 0.72, 2, '#b0b0b0')} strokeLinecap="round" />
      <line x1={cx} y1={cy} {...hand(secAngle, r * 0.82, 1, accent)} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill={accent} />
      <circle cx={cx} cy={cy} r={1.5} fill="#fff" />
    </svg>
  )
})
AnalogClock.displayName = 'AnalogClock'

// ── 主组件 ──────────────────────────────────────────────

export default function WorldClock() {
  const [cities, setCities] = useState<CityEntry[]>(DEFAULT_CITIES)
  const [now, setNow] = useState(() => new Date())
  const [showAnalog, setShowAnalog] = useState(false)
  const [is24h, setIs24h] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tzSearch, setTzSearch] = useState('')
  const [newCityName, setNewCityName] = useState('')
  const [selectedTz, setSelectedTz] = useState('')
  const [diffCityA, setDiffCityA] = useState('')
  const [diffCityB, setDiffCityB] = useState('')
  const [showDiffPanel, setShowDiffPanel] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // 实时更新 — 每秒
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // 添加城市
  const addCity = useCallback(() => {
    if (!newCityName.trim() || !selectedTz) return
    const entry: CityEntry = {
      id: `custom-${Date.now()}`, city: newCityName.trim(),
      country: 'Custom', timezone: selectedTz, emoji: '🌍', custom: true,
    }
    setCities(prev => [...prev, entry])
    setNewCityName(''); setSelectedTz(''); setTzSearch(''); setShowAddModal(false)
  }, [newCityName, selectedTz])

  // 删除城市
  const removeCity = useCallback((id: string) => {
    setCities(prev => prev.filter(c => c.id !== id))
  }, [])

  // 重置为默认
  const resetCities = useCallback(() => {
    setCities(DEFAULT_CITIES)
  }, [])

  // 格式化时间
  const formatTime = useCallback((h: number, m: number, s: number) => {
    if (is24h) return `${pad(h)}:${pad(m)}:${pad(s)}`
    const period = h >= 12 ? 'PM' : 'AM'
    return `${pad(h % 12 || 12)}:${pad(m)}:${pad(s)} ${period}`
  }, [is24h])

  // 格式化简短时间（不带秒）
  const formatTimeShort = useCallback((h: number, m: number) => {
    if (is24h) return `${pad(h)}:${pad(m)}`
    const period = h >= 12 ? 'PM' : 'AM'
    return `${pad(h % 12 || 12)}:${pad(m)} ${period}`
  }, [is24h])

  // 时区搜索过滤
  const filteredTzList = Object.entries(ALL_TIMEZONES).filter(
    ([tz, name]) => tz.toLowerCase().includes(tzSearch.toLowerCase()) ||
      name.toLowerCase().includes(tzSearch.toLowerCase())
  )

  // 城市搜索过滤
  const filteredCities = cities.filter(c =>
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.timezone.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 时差计算
  const diffResult = diffCityA && diffCityB
    ? (() => {
        const cA = cities.find(c => c.id === diffCityA)
        const cB = cities.find(c => c.id === diffCityB)
        if (!cA || !cB) return null
        const diff = calcHourDiff(cA.timezone, cB.timezone, now)
        const abs = Math.abs(diff)
        const sign = diff > 0 ? '+' : diff < 0 ? '' : ''
        return { cityA: cA.city, cityB: cB.city, diff, abs, sign, tzA: cA.timezone, tzB: cB.timezone }
      })()
    : null

  // 样式
  const theme = {
    bg: '#1a1a2e',
    bgCard: '#16213e',
    bgElevated: '#0f3460',
    accent: '#e94560',
    accentSoft: 'rgba(233,69,96,0.15)',
    text: '#e8e8f0',
    textDim: 'rgba(232,232,240,0.55)',
    border: 'rgba(255,255,255,0.08)',
    surface: 'rgba(255,255,255,0.04)',
  }

  const S = {
    container: {
      height: '100%', overflowY: 'auto' as const, background: theme.bg,
      color: theme.text, fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
      padding: 20, boxSizing: 'border-box' as const,
    },
    header: {
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
      flexWrap: 'wrap' as const,
    },
    title: {
      display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800,
      letterSpacing: '-0.02em', marginRight: 'auto',
    },
    titleDot: {
      width: 10, height: 10, borderRadius: '50%', background: theme.accent,
      boxShadow: `0 0 12px ${theme.accent}88`, animation: 'pulse 2s infinite',
    },
    toolbar: { display: 'flex', gap: 6, alignItems: 'center' },
    iconBtn: (active?: boolean) => ({
      display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36,
      borderRadius: 10, border: `1px solid ${active ? theme.accent : theme.border}`,
      background: active ? theme.accentSoft : theme.surface, color: active ? theme.accent : theme.textDim,
      cursor: 'pointer' as const, transition: 'all 0.2s',
    }),
    primaryBtn: {
      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
      borderRadius: 10, background: theme.accent, border: 'none', color: '#fff',
      cursor: 'pointer' as const, fontSize: 13, fontWeight: 600,
      boxShadow: `0 4px 16px ${theme.accent}44`, transition: 'all 0.2s',
    },
    searchBox: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
      borderRadius: 10, background: theme.surface, border: `1px solid ${theme.border}`,
      marginBottom: 16, width: '100%', boxSizing: 'border-box' as const,
    },
    searchInput: {
      flex: 1, background: 'none', border: 'none', outline: 'none', color: theme.text,
      fontSize: 13, fontFamily: 'inherit',
    },
    grid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14,
    },
    card: (isHovered: boolean, _isDay: boolean) => ({
      padding: 16, borderRadius: 14, position: 'relative' as const,
      background: isHovered
        ? `linear-gradient(135deg, ${theme.bgCard} 0%, ${theme.bgElevated} 100%)`
        : theme.bgCard,
      border: `1px solid ${isHovered ? theme.accent + '44' : theme.border}`,
      transition: 'all 0.25s ease', cursor: 'default',
      boxShadow: isHovered ? `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
    }),
    cardTop: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
    },
    cityLabel: {
      display: 'flex', alignItems: 'center', gap: 8,
    },
    emoji: { fontSize: 20 },
    cityName: { fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' },
    country: { fontSize: 11, color: theme.textDim, fontWeight: 400 },
    dayBadge: (isDay: boolean) => ({
      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const,
      background: isDay ? 'rgba(255,200,50,0.12)' : 'rgba(100,120,200,0.12)',
      color: isDay ? '#f0c040' : '#8090d0',
    }),
    timeDisplay: {
      fontSize: 36, fontWeight: 200, lineHeight: 1, marginBottom: 8,
      fontVariantNumeric: 'tabular-nums' as const,
      letterSpacing: '0.01em',
    },
    dateLine: {
      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: theme.textDim, marginBottom: 6,
    },
    tzLine: {
      display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.textDim, opacity: 0.7,
    },
    removeBtn: {
      position: 'absolute' as const, top: 10, right: 10, width: 26, height: 26,
      borderRadius: 7, background: 'rgba(233,69,96,0.12)', border: 'none',
      color: theme.accent, cursor: 'pointer' as const,
      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
    },
    modal: {
      position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: 20,
    },
    modalBox: {
      width: '100%', maxWidth: 440, borderRadius: 16, background: theme.bg,
      border: `1px solid ${theme.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', padding: 24,
    },
    modalTitle: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18,
    },
    input: {
      width: '100%', padding: '10px 12px', borderRadius: 10,
      background: theme.surface, border: `1px solid ${theme.border}`,
      color: theme.text, fontSize: 13, outline: 'none', marginBottom: 12,
      boxSizing: 'border-box' as const, fontFamily: 'inherit',
    },
    label: { fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' as const, color: theme.textDim },
    tzList: {
      maxHeight: 160, overflowY: 'auto' as const, borderRadius: 10,
      border: `1px solid ${theme.border}`, background: theme.surface, marginBottom: 14,
    },
    tzItem: (sel: boolean) => ({
      padding: '8px 12px', cursor: 'pointer', fontSize: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${theme.border}`,
      background: sel ? theme.accentSoft : 'transparent', transition: 'all 0.15s',
    }),
    modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
    cancelBtn: {
      padding: '8px 16px', borderRadius: 10, background: theme.surface,
      border: `1px solid ${theme.border}`, color: theme.text, cursor: 'pointer' as const, fontSize: 13,
    },
    confirmBtn: (enabled: boolean) => ({
      padding: '8px 16px', borderRadius: 10, background: enabled ? theme.accent : theme.surface,
      border: 'none', color: enabled ? '#fff' : theme.textDim,
      cursor: enabled ? ('pointer' as const) : ('not-allowed' as const),
      fontSize: 13, fontWeight: 600, opacity: enabled ? 1 : 0.5,
    }),
    diffPanel: {
      padding: 18, borderRadius: 14, background: theme.bgCard,
      border: `1px solid ${theme.border}`, marginBottom: 16,
    },
    diffHeader: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
    },
    diffTitle: {
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700,
    },
    diffBody: {
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const,
    },
    diffSelect: {
      flex: '1 1 160px', padding: '8px 12px', borderRadius: 10,
      background: theme.surface, border: `1px solid ${theme.border}`,
      color: theme.text, fontSize: 12, outline: 'none', fontFamily: 'inherit',
    },
    diffResult: {
      textAlign: 'center' as const, padding: '14px 0 4px', fontSize: 13, color: theme.textDim,
    },
    diffValue: {
      fontSize: 28, fontWeight: 700, color: theme.accent, fontFamily: 'inherit',
      letterSpacing: '-0.02em',
    },
    diffTimesRow: {
      display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8, fontSize: 12,
    },
    diffTimeBox: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2,
    },
    diffTimeLabel: { color: theme.textDim, fontSize: 10, fontWeight: 600 },
    diffTimeValue: { color: theme.text, fontSize: 14, fontWeight: 600 },
    footer: {
      marginTop: 16, padding: '12px 16px', borderRadius: 10, textAlign: 'center' as const,
      fontSize: 11, color: theme.textDim, background: theme.surface,
      border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 6,
    },
    emptyState: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      justifyContent: 'center', padding: 60, color: theme.textDim, gap: 10,
    },
    clockToggle: {
      display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${theme.border}`,
    },
    clockToggleBtn: (active: boolean) => ({
      padding: '5px 10px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' as const,
      background: active ? theme.accent : 'transparent',
      color: active ? '#fff' : theme.textDim, transition: 'all 0.2s',
    }),
  }

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const localParts = getTimeParts(localTz, now)

  return (
    <div style={S.container}>
      {/* 顶部标题栏 */}
      <div style={S.header}>
        <div style={S.title}>
          <Globe size={22} style={{ color: theme.accent }} />
          <span>World Clock</span>
        </div>
        <div style={S.toolbar}>
          <div style={S.clockToggle}>
            <button style={S.clockToggleBtn(!showAnalog)} onClick={() => setShowAnalog(false)}>
              Digital
            </button>
            <button style={S.clockToggleBtn(showAnalog)} onClick={() => setShowAnalog(true)}>
              Analog
            </button>
          </div>
          <button style={S.iconBtn(is24h)} onClick={() => setIs24h(p => !p)} title="切换12/24小时制">
            <Clock size={16} />
          </button>
          <button style={S.iconBtn(showDiffPanel)} onClick={() => setShowDiffPanel(p => !p)} title="时差计算器">
            <ArrowRightLeft size={16} />
          </button>
          <button style={S.iconBtn(false)} onClick={resetCities} title="重置为默认城市">
            <RotateCcw size={16} />
          </button>
          <button style={S.primaryBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> 添加城市
          </button>
        </div>
      </div>

      {/* 本地时钟 */}
      <div style={{
        ...S.card(false, localParts.isDaytime), padding: 20, marginBottom: 16,
        background: `linear-gradient(135deg, ${theme.bgElevated} 0%, ${theme.bgCard} 100%)`,
        border: `1px solid ${theme.accent}33`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <MapPin size={16} style={{ color: theme.accent }} />
            <div>
              <div style={{ fontSize: 12, color: theme.textDim, marginBottom: 2 }}>LOCAL TIME</div>
              <div style={{ fontSize: 38, fontWeight: 200, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em', lineHeight: 1 }}>
                {formatTime(localParts.hours, localParts.minutes, localParts.seconds)}
              </div>
              <div style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>
                {localParts.year}-{pad(localParts.month)}-{pad(localParts.day)} {localParts.weekday}
              </div>
            </div>
          </div>
          {showAnalog && (
            <AnalogClock
              seconds={localParts.seconds} minutes={localParts.minutes}
              hours={localParts.hours} accent={theme.accent}
            />
          )}
        </div>
      </div>

      {/* 时差计算器面板 */}
      {showDiffPanel && (
        <div style={S.diffPanel}>
          <div style={S.diffHeader}>
            <div style={S.diffTitle}>
              <ArrowRightLeft size={16} style={{ color: theme.accent }} />
              <span>时差计算器</span>
            </div>
            <button style={S.iconBtn(false)} onClick={() => { setShowDiffPanel(false); setDiffCityA(''); setDiffCityB('') }}>
              <X size={14} />
            </button>
          </div>
          <div style={S.diffBody}>
            <select
              style={S.diffSelect} value={diffCityA}
              onChange={e => setDiffCityA(e.target.value)}
            >
              <option value="">选择城市 A</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.city}</option>)}
            </select>
            <ArrowRightLeft size={16} style={{ color: theme.accent, flexShrink: 0 }} />
            <select
              style={S.diffSelect} value={diffCityB}
              onChange={e => setDiffCityB(e.target.value)}
            >
              <option value="">选择城市 B</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.city}</option>)}
            </select>
          </div>
          {diffResult && (
            <div style={S.diffResult}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: theme.text }}>{diffResult.cityA}</span>
                {' → '}
                <span style={{ color: theme.text }}>{diffResult.cityB}</span>
              </div>
              <div style={S.diffValue}>
                {diffResult.diff === 0 ? '同时' : `${diffResult.sign}${diffResult.abs} 小时`}
              </div>
              {diffResult.diff !== 0 && (
                <div style={{ fontSize: 11, color: theme.textDim, marginTop: 2 }}>
                  {diffResult.diff > 0
                    ? `${diffResult.cityB} 比 ${diffResult.cityA} 快 ${diffResult.abs} 小时`
                    : `${diffResult.cityA} 比 ${diffResult.cityB} 快 ${diffResult.abs} 小时`
                  }
                </div>
              )}
              <div style={S.diffTimesRow}>
                <div style={S.diffTimeBox}>
                  <span style={S.diffTimeLabel}>{diffResult.cityA}</span>
                  <span style={S.diffTimeValue}>
                    {(() => { const p = getTimeParts(diffResult.tzA, now); return formatTimeShort(p.hours, p.minutes) })()}
                  </span>
                </div>
                <div style={S.diffTimeBox}>
                  <span style={S.diffTimeLabel}>{diffResult.cityB}</span>
                  <span style={S.diffTimeValue}>
                    {(() => { const p = getTimeParts(diffResult.tzB, now); return formatTimeShort(p.hours, p.minutes) })()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 搜索框 */}
      <div style={S.searchBox}>
        <Search size={15} style={{ color: theme.textDim, flexShrink: 0 }} />
        <input
          style={S.searchInput}
          placeholder="搜索城市、国家或时区..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', padding: 2, display: 'flex' }}
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 城市时钟网格 */}
      {filteredCities.length === 0 ? (
        <div style={S.emptyState}>
          <Globe size={40} style={{ opacity: 0.2 }} />
          <span style={{ fontSize: 13 }}>{searchQuery ? '未找到匹配的城市' : '暂无城市，点击"添加城市"开始'}</span>
        </div>
      ) : (
        <div style={S.grid}>
          {filteredCities.map(city => {
            const p = getTimeParts(city.timezone, now)
            const offset = getOffsetLabel(city.timezone, now)
            const isHov = hoveredCard === city.id

            return (
              <div
                key={city.id}
                style={S.card(isHov, p.isDaytime)}
                onMouseEnter={() => setHoveredCard(city.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {city.custom && (
                  <button
                    style={{ ...S.removeBtn, opacity: isHov ? 1 : 0 }}
                    onClick={() => removeCity(city.id)}
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                )}

                <div style={S.cardTop}>
                  <div style={S.cityLabel}>
                    <span style={S.emoji}>{city.emoji}</span>
                    <div>
                      <div style={S.cityName}>{city.city}</div>
                      <div style={S.country}>{city.country}</div>
                    </div>
                  </div>
                  <div style={S.dayBadge(p.isDaytime)}>
                    {p.isDaytime ? <Sun size={10} style={{ marginRight: 3 }} /> : <Moon size={10} style={{ marginRight: 3 }} />}
                    {p.isDaytime ? 'DAY' : 'NIGHT'}
                  </div>
                </div>

                {showAnalog ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <AnalogClock
                      seconds={p.seconds} minutes={p.minutes}
                      hours={p.hours} accent={theme.accent}
                    />
                    <div>
                      <div style={{ ...S.timeDisplay, fontSize: 20 }}>
                        {formatTimeShort(p.hours, p.minutes)}
                      </div>
                      <div style={S.dateLine}>
                        {p.year}-{pad(p.month)}-{pad(p.day)} {p.weekday}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={S.timeDisplay}>{formatTime(p.hours, p.minutes, p.seconds)}</div>
                    <div style={S.dateLine}>
                      {p.year}-{pad(p.month)}-{pad(p.day)} {p.weekday}
                    </div>
                  </>
                )}

                <div style={S.tzLine}>
                  <MapPin size={10} />
                  {city.timezone}
                  {offset && ` · ${offset}`}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 底部 */}
      <div style={S.footer}>
        <Clock size={12} />
        <span>{cities.length} 个城市 · 每秒更新 · 本地时区 {localTz}</span>
      </div>

      {/* 添加城市弹窗 */}
      {showAddModal && (
        <div style={S.modal} onClick={() => setShowAddModal(false)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Globe size={18} style={{ color: theme.accent }} />
                <span style={{ fontSize: 16, fontWeight: 700 }}>添加城市</span>
              </div>
              <button style={S.iconBtn(false)} onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <label style={S.label}>城市名称</label>
            <input
              style={S.input} placeholder="例如：Seoul"
              value={newCityName} onChange={e => setNewCityName(e.target.value)} autoFocus
            />

            <label style={S.label}>搜索时区</label>
            <input
              style={{ ...S.input, marginBottom: 8 }} placeholder="搜索时区或城市名..."
              value={tzSearch} onChange={e => setTzSearch(e.target.value)}
            />

            <div style={S.tzList}>
              {filteredTzList.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: theme.textDim, fontSize: 12 }}>
                  未找到匹配的时区
                </div>
              ) : (
                filteredTzList.map(([tz, name]) => (
                  <div
                    key={tz} style={S.tzItem(selectedTz === tz)}
                    onClick={() => setSelectedTz(tz)}
                  >
                    <span>{name} — <span style={{ opacity: 0.5 }}>{tz}</span></span>
                    {selectedTz === tz && <span style={{ color: theme.accent, fontWeight: 700 }}>✓</span>}
                  </div>
                ))
              )}
            </div>

            <div style={S.modalActions}>
              <button style={S.cancelBtn} onClick={() => setShowAddModal(false)}>取消</button>
              <button
                style={S.confirmBtn(!!(newCityName.trim() && selectedTz))}
                onClick={addCity}
                disabled={!newCityName.trim() || !selectedTz}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
