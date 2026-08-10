import { useState, useEffect, useCallback } from 'react'
import {
  Globe,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Calendar,
  Sun,
  Moon,
  X,
  Check,
  MapPin,
  Sunrise,
  Sunset,
} from 'lucide-react'

interface CityClock {
  id: string
  city: string
  timezone: string
  custom?: boolean
}

const DEFAULT_CITIES: CityClock[] = [
  { id: 'beijing', city: '北京', timezone: 'Asia/Shanghai' },
  { id: 'tokyo', city: '东京', timezone: 'Asia/Tokyo' },
  { id: 'newyork', city: '纽约', timezone: 'America/New_York' },
  { id: 'london', city: '伦敦', timezone: 'Europe/London' },
  { id: 'paris', city: '巴黎', timezone: 'Europe/Paris' },
  { id: 'sydney', city: '悉尼', timezone: 'Australia/Sydney' },
]

const AVAILABLE_TIMEZONES = [
  'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Hong_Kong',
  'Asia/Singapore', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Europe/Istanbul', 'America/New_York', 'America/Los_Angeles',
  'America/Chicago', 'America/Toronto', 'America/Sao_Paulo',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
]

const STORAGE_KEY = 'weblinux-worldclock-settings'

interface Settings {
  cities: CityClock[]
  is24Hour: boolean
  isDark: boolean
}

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Settings
      return {
        cities: parsed.cities || DEFAULT_CITIES,
        is24Hour: parsed.is24Hour ?? true,
        isDark: parsed.isDark ?? true,
      }
    }
  } catch {
  }
  return { cities: DEFAULT_CITIES, is24Hour: true, isDark: true }
}

function getTimeParts(timezone: string, date?: Date): {
  hours: number
  minutes: number
  seconds: number
  year: number
  month: number
  day: number
  weekday: string
  dayPeriod: string
} {
  try {
    const targetDate = date || new Date()
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
      hourCycle: 'h23',
    })
    const parts = formatter.formatToParts(targetDate)
    const get = (type: string) => parts.find(p => p.type === type)?.value || '0'

    const hours = parseInt(get('hour'))
    const minutes = parseInt(get('minute'))
    const seconds = parseInt(get('second'))

    return {
      hours,
      minutes,
      seconds,
      year: parseInt(get('year')),
      month: parseInt(get('month')),
      day: parseInt(get('day')),
      weekday: get('weekday'),
      dayPeriod: hours >= 6 && hours < 18 ? '白天' : '夜晚',
    }
  } catch {
    return {
      hours: 0, minutes: 0, seconds: 0,
      year: 2024, month: 1, day: 1, weekday: '周日', dayPeriod: '夜晚',
    }
  }
}

function formatOffset(timezone: string, date?: Date): string {
  try {
    const targetDate = date || new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(targetDate)
    const tzPart = parts.find(p => p.type === 'timeZoneName')
    return tzPart?.value || ''
  } catch {
    return ''
  }
}

export default function WorldClock() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [now, setNow] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCityName, setNewCityName] = useState('')
  const [newCityTz, setNewCityTz] = useState('')
  const [searchTz, setSearchTz] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setNow(new Date())
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
    }
  }, [settings])

  const toggleHourFormat = useCallback(() => {
    setSettings(prev => ({ ...prev, is24Hour: !prev.is24Hour }))
  }, [])

  const toggleTheme = useCallback(() => {
    setSettings(prev => ({ ...prev, isDark: !prev.isDark }))
  }, [])

  const removeCity = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      cities: prev.cities.filter(c => c.id !== id),
    }))
  }, [])

  const addCity = useCallback(() => {
    if (!newCityName.trim() || !newCityTz) return
    const id = `custom-${Date.now()}`
    setSettings(prev => ({
      ...prev,
      cities: [...prev.cities, {
        id,
        city: newCityName.trim(),
        timezone: newCityTz,
        custom: true,
      }],
    }))
    setNewCityName('')
    setNewCityTz('')
    setSearchTz('')
    setShowAddModal(false)
  }, [newCityName, newCityTz])

  const handleDragStart = useCallback((id: string) => {
    setDragId(id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOverId(id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragId(null)
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback((targetId: string) => {
    if (!dragId || dragId === targetId) return
    setSettings(prev => {
      const newCities = [...prev.cities]
      const dragIndex = newCities.findIndex(c => c.id === dragId)
      const targetIndex = newCities.findIndex(c => c.id === targetId)
      if (dragIndex === -1 || targetIndex === -1) return prev
      const [removed] = newCities.splice(dragIndex, 1)
      newCities.splice(targetIndex, 0, removed)
      return { ...prev, cities: newCities }
    })
    setDragId(null)
    setDragOverId(null)
  }, [dragId])

  const filteredTimezones = AVAILABLE_TIMEZONES.filter(tz =>
    tz.toLowerCase().includes(searchTz.toLowerCase())
  )

  const bgStyle = settings.isDark
    ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
    : 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #fbc2eb 100%)'

  const textColor = settings.isDark ? '#e8e8f0' : '#2d2d3f'
  const subTextColor = settings.isDark ? 'rgba(232,232,240,0.6)' : 'rgba(45,45,63,0.6)'
  const cardBorder = settings.isDark
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(255,255,255,0.6)'
  const headerBg = settings.isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(255,255,255,0.35)'
  const btnBg = settings.isDark
    ? 'rgba(255,255,255,0.1)'
    : 'rgba(255,255,255,0.5)'
  const accentColor = settings.isDark ? '#7c6cf0' : '#5b4cc4'
  const dangerColor = '#ef4444'

  const styles = {
    container: {
      height: '100%',
      overflowY: 'auto' as const,
      padding: 20,
      background: bgStyle,
      color: textColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    glassHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 18px',
      borderRadius: 16,
      background: headerBg,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${cardBorder}`,
      marginBottom: 20,
      boxShadow: settings.isDark
        ? '0 8px 32px rgba(0,0,0,0.3)'
        : '0 8px 32px rgba(31,38,135,0.15)',
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginRight: 'auto',
    },
    toolbar: {
      display: 'flex',
      gap: 8,
    },
    iconBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 38,
      height: 38,
      borderRadius: 12,
      background: btnBg,
      border: `1px solid ${cardBorder}`,
      color: textColor,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    addBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 16px',
      borderRadius: 12,
      background: accentColor,
      border: 'none',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      transition: 'all 0.2s ease',
      boxShadow: `0 4px 14px ${accentColor}66`,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16,
    },
    card: (isDaytime: boolean, isDragging: boolean, isDragOver: boolean) => ({
      padding: 20,
      borderRadius: 20,
      background: isDaytime
        ? (settings.isDark
            ? 'linear-gradient(135deg, rgba(255,183,77,0.12) 0%, rgba(255,152,0,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(255,256,255,0.5) 0%, rgba(255,256,255,0.35) 100%)')
        : (settings.isDark
            ? 'linear-gradient(135deg, rgba(30,30,60,0.4) 0%, rgba(20,20,40,0.3) 100%)'
            : 'linear-gradient(135deg, rgba(100,100,160,0.25) 0%, rgba(70,70,120,0.15) 100%)'),
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${cardBorder}`,
      boxShadow: isDragOver
        ? `0 0 0 2px ${accentColor}, 0 8px 32px rgba(0,0,0,0.2)`
        : settings.isDark
            ? '0 8px 32px rgba(0,0,0,0.25)'
            : '0 8px 32px rgba(31,38,135,0.12)',
      cursor: 'grab',
      opacity: isDragging ? 0.5 : 1,
      transform: isDragging ? 'scale(0.98)' : 'scale(1)',
      transition: 'all 0.25s ease',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    }),
    cardTop: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    dragHandle: {
      cursor: 'grab',
      opacity: 0.4,
      display: 'flex',
      alignItems: 'center',
      color: subTextColor,
    },
    cityName: {
      fontSize: 17,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    dayBadge: (isDaytime: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: isDaytime
        ? (settings.isDark ? 'rgba(255,183,77,0.2)' : 'rgba(255,152,0,0.25)')
        : (settings.isDark ? 'rgba(100,100,200,0.2)' : 'rgba(80,80,140,0.2)'),
      color: isDaytime
        ? (settings.isDark ? '#ffb74d' : '#e65100')
        : (settings.isDark ? '#b39ddb' : '#4527a0'),
    }),
    timeDisplay: {
      fontSize: 42,
      fontWeight: 200,
      letterSpacing: '0.02em',
      lineHeight: 1,
      marginBottom: 8,
      fontVariantNumeric: 'tabular-nums',
      fontFamily: '"SF Mono", "Fira Code", monospace',
    },
    dateDisplay: {
      fontSize: 13,
      color: subTextColor,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginBottom: 6,
    },
    tzDisplay: {
      fontSize: 11,
      color: subTextColor,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      opacity: 0.8,
    },
    removeBtn: {
      position: 'absolute' as const,
      top: 12,
      right: 12,
      width: 28,
      height: 28,
      borderRadius: 8,
      background: 'rgba(239,68,68,0.15)',
      border: 'none',
      color: dangerColor,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'opacity 0.2s',
    },
    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 24,
      background: settings.isDark
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f0f0f5 100%)',
      border: `1px solid ${cardBorder}`,
      boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
      padding: 28,
      color: textColor,
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 12,
      background: settings.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      border: `1px solid ${cardBorder}`,
      color: textColor,
      fontSize: 14,
      outline: 'none',
      marginBottom: 12,
      boxSizing: 'border-box' as const,
    },
    label: {
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 6,
      display: 'block' as const,
      color: subTextColor,
    },
    tzList: {
      maxHeight: 180,
      overflowY: 'auto' as const,
      borderRadius: 12,
      border: `1px solid ${cardBorder}`,
      background: settings.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      marginBottom: 16,
    },
    tzItem: (selected: boolean) => ({
      padding: '10px 14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${settings.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
      background: selected
        ? (settings.isDark ? 'rgba(124,108,240,0.2)' : 'rgba(91,76,196,0.12)')
        : 'transparent',
      fontSize: 13,
      transition: 'background 0.15s',
    }),
    modalActions: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end',
    },
    cancelBtn: {
      padding: '10px 20px',
      borderRadius: 12,
      background: btnBg,
      border: `1px solid ${cardBorder}`,
      color: textColor,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 500,
    },
    confirmBtn: {
      padding: '10px 20px',
      borderRadius: 12,
      background: accentColor,
      border: 'none',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      boxShadow: `0 4px 14px ${accentColor}66`,
    },
    localCard: {
      padding: 24,
      borderRadius: 20,
      background: settings.isDark
        ? 'linear-gradient(135deg, rgba(124,108,240,0.2) 0%, rgba(79,70,229,0.12) 100%)'
        : 'linear-gradient(135deg, rgba(91,76,196,0.15) 0%, rgba(167,139,250,0.1) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${settings.isDark ? 'rgba(124,108,240,0.3)' : 'rgba(91,76,196,0.25)'}`,
      marginBottom: 20,
      textAlign: 'center' as const,
    },
    localLabel: {
      fontSize: 12,
      color: subTextColor,
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    localTime: {
      fontSize: 52,
      fontWeight: 200,
      letterSpacing: '0.02em',
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
      fontFamily: '"SF Mono", "Fira Code", monospace',
      marginBottom: 8,
    },
    footer: {
      marginTop: 20,
      padding: 14,
      borderRadius: 14,
      background: settings.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.2)',
      textAlign: 'center' as const,
      fontSize: 12,
      color: subTextColor,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${cardBorder}`,
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: 60,
      color: subTextColor,
    },
  }

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const localParts = getTimeParts(localTz, now)

  const formatTime12 = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM'
    const displayH = h % 12 || 12
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
  }

  const formatTime24 = (h: number, m: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const getDisplayTime = (h: number, m: number) => {
    return settings.is24Hour ? formatTime24(h, m) : formatTime12(h, m)
  }

  return (
    <div style={styles.container}>
      <div style={styles.glassHeader}>
        <div style={styles.title}>
          <Globe size={22} style={{ color: accentColor }} />
          世界时钟
        </div>
        <div style={styles.toolbar}>
          <button
            style={styles.iconBtn}
            onClick={toggleHourFormat}
            title={settings.is24Hour ? '切换12小时制' : '切换24小时制'}
          >
            <Clock size={18} />
          </button>
          <button
            style={styles.iconBtn}
            onClick={toggleTheme}
            title={settings.isDark ? '切换亮色主题' : '切换暗色主题'}
          >
            {settings.isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            style={styles.addBtn}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            添加城市
          </button>
        </div>
      </div>

      <div style={styles.localCard}>
        <div style={styles.localLabel}>
          <MapPin size={14} />
          本地时区 · {localTz}
        </div>
        <div style={styles.localTime}>
          {getDisplayTime(localParts.hours, localParts.minutes)}
        </div>
        <div style={{ fontSize: 14, color: subTextColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Calendar size={14} />
          {localParts.year}年{localParts.month}月{localParts.day}日 {localParts.weekday}
        </div>
      </div>

      {settings.cities.length === 0 ? (
        <div style={styles.emptyState}>
          <Globe size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>暂无城市，点击"添加城市"开始</div>
        </div>
      ) : (
        <div style={styles.grid}>
          {settings.cities.map(city => {
            const parts = getTimeParts(city.timezone, now)
            const isDay = parts.hours >= 6 && parts.hours < 18
            const offset = formatOffset(city.timezone, now)
            const isDragging = dragId === city.id
            const isDragOver = dragOverId === city.id

            return (
              <div
                key={city.id}
                draggable
                onDragStart={() => handleDragStart(city.id)}
                onDragOver={(e) => handleDragOver(e, city.id)}
                onDragLeave={() => setDragOverId(null)}
                onDrop={() => handleDrop(city.id)}
                onDragEnd={handleDragEnd}
                style={styles.card(isDay, isDragging, isDragOver)}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget.querySelector('button') as HTMLButtonElement
                  if (btn) btn.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget.querySelector('button') as HTMLButtonElement
                  if (btn) btn.style.opacity = '0'
                }}
              >
                {city.custom && (
                  <button
                    style={styles.removeBtn}
                    onClick={() => removeCity(city.id)}
                    title="删除城市"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <div style={styles.cardTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={styles.dragHandle}>
                      <GripVertical size={16} />
                    </div>
                    <div style={styles.cityName}>
                      {city.city}
                    </div>
                  </div>
                  <div style={styles.dayBadge(isDay)}>
                    {isDay ? <Sunrise size={12} /> : <Sunset size={12} />}
                    {parts.dayPeriod}
                  </div>
                </div>

                <div style={styles.timeDisplay}>
                  {getDisplayTime(parts.hours, parts.minutes)}
                </div>

                <div style={styles.dateDisplay}>
                  <Calendar size={13} />
                  {parts.year}年{parts.month}月{parts.day}日 {parts.weekday}
                </div>

                <div style={styles.tzDisplay}>
                  <Globe size={12} />
                  {city.timezone}
                  {offset && ` · ${offset}`}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={styles.footer}>
        💡 拖拽卡片调整顺序 · 点击按钮切换主题和时间格式 · 设置自动保存
      </div>

      {showAddModal && (
        <div style={styles.modal} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: accentColor + '33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Globe size={18} style={{ color: accentColor }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>添加城市</div>
              </div>
              <button
                style={styles.iconBtn}
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <label style={styles.label}>城市名称</label>
            <input
              style={styles.input}
              placeholder="例如：首尔"
              value={newCityName}
              onChange={e => setNewCityName(e.target.value)}
              autoFocus
            />

            <label style={styles.label}>搜索时区</label>
            <input
              style={{ ...styles.input, marginBottom: 8 }}
              placeholder="搜索时区..."
              value={searchTz}
              onChange={e => setSearchTz(e.target.value)}
            />

            <div style={styles.tzList}>
              {filteredTimezones.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: subTextColor, fontSize: 13 }}>
                  未找到匹配的时区
                </div>
              ) : (
                filteredTimezones.map(tz => (
                  <div
                    key={tz}
                    style={styles.tzItem(newCityTz === tz)}
                    onClick={() => setNewCityTz(tz)}
                  >
                    <span>{tz}</span>
                    {newCityTz === tz && <Check size={16} style={{ color: accentColor }} />}
                  </div>
                ))
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button
                style={{
                  ...styles.confirmBtn,
                  opacity: !newCityName.trim() || !newCityTz ? 0.5 : 1,
                  cursor: !newCityName.trim() || !newCityTz ? 'not-allowed' : 'pointer',
                }}
                onClick={addCity}
                disabled={!newCityName.trim() || !newCityTz}
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