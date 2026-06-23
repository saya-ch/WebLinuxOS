import { useState, useEffect, useCallback, memo } from 'react'

// 世界时钟 - 显示全球主要城市实时时间
interface CityTime {
  id: string
  city: string
  country: string
  timezone: string
  offset: number
  localTime: Date
  isDaytime: boolean
}

const WORLD_CITIES: CityTime[] = [
  { id: 'beijing', city: '北京', country: '中国', timezone: 'Asia/Shanghai', offset: 8, localTime: new Date(), isDaytime: false },
  { id: 'shanghai', city: '上海', country: '中国', timezone: 'Asia/Shanghai', offset: 8, localTime: new Date(), isDaytime: false },
  { id: 'tokyo', city: '东京', country: '日本', timezone: 'Asia/Tokyo', offset: 9, localTime: new Date(), isDaytime: false },
  { id: 'newyork', city: '纽约', country: '美国', timezone: 'America/New_York', offset: -5, localTime: new Date(), isDaytime: false },
  { id: 'london', city: '伦敦', country: '英国', timezone: 'Europe/London', offset: 0, localTime: new Date(), isDaytime: false },
  { id: 'paris', city: '巴黎', country: '法国', timezone: 'Europe/Paris', offset: 1, localTime: new Date(), isDaytime: false },
  { id: 'sydney', city: '悉尼', country: '澳大利亚', timezone: 'Australia/Sydney', offset: 11, localTime: new Date(), isDaytime: false },
  { id: 'moscow', city: '莫斯科', country: '俄罗斯', timezone: 'Europe/Moscow', offset: 3, localTime: new Date(), isDaytime: false },
  { id: 'dubai', city: '迪拜', country: '阿联酋', timezone: 'Asia/Dubai', offset: 4, localTime: new Date(), isDaytime: false },
  { id: 'singapore', city: '新加坡', country: '新加坡', timezone: 'Asia/Singapore', offset: 8, localTime: new Date(), isDaytime: false },
  { id: 'losangeles', city: '洛杉矶', country: '美国', timezone: 'America/Los_Angeles', offset: -8, localTime: new Date(), isDaytime: false },
  { id: 'berlin', city: '柏林', country: '德国', timezone: 'Europe/Berlin', offset: 1, localTime: new Date(), isDaytime: false },
  { id: 'mumbai', city: '孟买', country: '印度', timezone: 'Asia/Kolkata', offset: 5.5, localTime: new Date(), isDaytime: false },
  { id: 'seoul', city: '首尔', country: '韩国', timezone: 'Asia/Seoul', offset: 9, localTime: new Date(), isDaytime: false },
  { id: 'hongkong', city: '香港', country: '中国', timezone: 'Asia/Hong_Kong', offset: 8, localTime: new Date(), isDaytime: false },
]

const STORAGE_KEY = 'weblinux-worldclock-favorites'

function getTimeInZone(timezone: string): Date {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    const parts = formatter.formatToParts(now)
    const partsMap = new Map(parts.map(p => [p.type, p.value]))
    
    const year = parseInt(partsMap.get('year') || '0')
    const month = parseInt(partsMap.get('month') || '1') - 1
    const day = parseInt(partsMap.get('day') || '1')
    const hour = parseInt(partsMap.get('hour') || '0')
    const minute = parseInt(partsMap.get('minute') || '0')
    const second = parseInt(partsMap.get('second') || '0')
    
    return new Date(year, month, day, hour, minute, second)
  } catch {
    return new Date()
  }
}

function isDaytime(hour: number): boolean {
  return hour >= 6 && hour < 20
}

function formatTime(date: Date, showSeconds: boolean = false): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  return showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`
}

function formatDate(date: Date): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekday = weekdays[date.getDay()]
  return `${month}/${day} ${weekday}`
}

function getOffsetString(offset: number): string {
  const sign = offset >= 0 ? '+' : ''
  const hours = Math.floor(Math.abs(offset))
  const minutes = (Math.abs(offset) % 1) * 60
  if (minutes === 0) {
    return `UTC${sign}${offset}`
  }
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`
}

const WorldClock = memo(function WorldClock() {
  const [cities, setCities] = useState<CityTime[]>(WORLD_CITIES)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showSeconds, setShowSeconds] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 加载收藏城市
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as string[]
        setFavorites(parsed)
      }
    } catch {
      // 忽略错误
    }
  }, [])

  // 保存收藏城市
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // 忽略错误
    }
  }, [favorites])

  // 更新时间
  useEffect(() => {
    const updateTimes = () => {
      setCities(prev => prev.map(city => {
        const localTime = getTimeInZone(city.timezone)
        return {
          ...city,
          localTime,
          isDaytime: isDaytime(localTime.getHours())
        }
      }))
    }

    updateTimes()
    const interval = setInterval(updateTimes, 1000)
    return () => clearInterval(interval)
  }, [])

  const toggleFavorite = useCallback((cityId: string) => {
    setFavorites(prev => {
      if (prev.includes(cityId)) {
        return prev.filter(id => id !== cityId)
      }
      return [...prev, cityId]
    })
  }, [])

  const filteredCities = cities.filter(city => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return city.city.toLowerCase().includes(query) || 
           city.country.toLowerCase().includes(query) ||
           city.timezone.toLowerCase().includes(query)
  })

  const sortedCities = [...filteredCities].sort((a, b) => {
    // 收藏的城市排在前面
    const aFav = favorites.includes(a.id)
    const bFav = favorites.includes(b.id)
    if (aFav && !bFav) return -1
    if (!aFav && bFav) return 1
    // 然后按时区排序
    return a.offset - b.offset
  })

  const localTime = getTimeInZone('Asia/Shanghai')

  return (
    <div style={{ 
      height: '100%', 
      overflowY: 'auto', 
      padding: 16, 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#e0e0e8'
    }}>
      {/* 顶部控制栏 */}
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <input
          type="text"
          placeholder="搜索城市..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.08)',
            color: '#e0e0e8',
            outline: 'none',
            fontSize: 13
          }}
        />
        <button
          onClick={() => setShowSeconds(!showSeconds)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: showSeconds ? 'rgba(124,108,240,0.3)' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e0e0e8',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          {showSeconds ? '显示秒' : '隐藏秒'}
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e0e0e8',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          {viewMode === 'grid' ? '网格' : '列表'}
        </button>
      </div>

      {/* 本地时间显示 */}
      <div style={{
        textAlign: 'center',
        padding: 20,
        marginBottom: 16,
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(124,108,240,0.25) 0%, rgba(79,70,229,0.15) 100%)',
        border: '1px solid rgba(124,108,240,0.3)'
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>本地时间 (北京时间)</div>
        <div style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.1 }}>
          {formatTime(localTime, showSeconds)}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>
          {formatDate(localTime)}
        </div>
      </div>

      {/* 收藏城市 */}
      {favorites.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'rgba(255,255,255,0.8)' }}>
            收藏的城市 ({favorites.length})
          </div>
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : undefined,
            flexDirection: viewMode === 'list' ? 'column' : undefined,
            gap: 12
          }}>
            {sortedCities.filter(c => favorites.includes(c.id)).map(city => (
              <div
                key={city.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: city.isDaytime 
                    ? 'linear-gradient(135deg, rgba(255,200,100,0.15) 0%, rgba(255,150,50,0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(100,100,150,0.15) 0%, rgba(50,50,100,0.1) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => toggleFavorite(city.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{city.city}</div>
                  <span style={{ fontSize: 18 }}>{city.isDaytime ? '☀️' : '🌙'}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 300, marginBottom: 4 }}>
                  {formatTime(city.localTime, showSeconds)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  {formatDate(city.localTime)} · {getOffsetString(city.offset)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  {city.country}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 所有城市 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'rgba(255,255,255,0.8)' }}>
          全球主要城市 ({sortedCities.length})
        </div>
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: 12
        }}>
          {sortedCities.map(city => (
            <div
              key={city.id}
              style={{
                padding: 16,
                borderRadius: 12,
                background: city.isDaytime 
                  ? 'rgba(255,200,100,0.08)'
                  : 'rgba(100,100,150,0.08)',
                border: favorites.includes(city.id) 
                  ? '1px solid rgba(124,108,240,0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'transform 0.2s, background 0.2s'
              }}
              onClick={() => toggleFavorite(city.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.background = city.isDaytime 
                  ? 'rgba(255,200,100,0.12)'
                  : 'rgba(100,100,150,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.background = city.isDaytime 
                  ? 'rgba(255,200,100,0.08)'
                  : 'rgba(100,100,150,0.08)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {city.city}
                  {favorites.includes(city.id) && <span style={{ marginLeft: 6, color: '#7c6cf0' }}>★</span>}
                </div>
                <span style={{ fontSize: 18 }}>{city.isDaytime ? '☀️' : '🌙'}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 300, marginBottom: 4 }}>
                {formatTime(city.localTime, showSeconds)}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                {formatDate(city.localTime)} · {getOffsetString(city.offset)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {city.country}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部说明 */}
      <div style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.03)',
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center'
      }}>
        点击城市卡片可添加/移除收藏 · 数据实时更新 · 支持全球主要时区
      </div>
    </div>
  )
})

export default WorldClock