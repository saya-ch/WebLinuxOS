import { useState, useEffect, useMemo, useCallback } from 'react'

// ==================== 类型定义 ====================
interface Country {
  cca3: string
  name: {
    common: string
    official: string
  }
  flags: {
    svg: string
    alt?: string
  }
  capital?: string[]
  population: number
  area: number
  region: string
  subregion?: string
  currencies?: { [key: string]: { name: string; symbol?: string } }
  languages?: { [key: string]: string }
  timezones?: string[]
  borders?: string[]
  latlng?: [number, number]
}

interface CountryDetail extends Country {
  currencyList: { name: string; symbol: string }[]
  languageList: string[]
  borderCountries: string[]
}

type SortKey = 'name' | 'population' | 'area'
type SortDir = 'asc' | 'desc'
type RegionFilter = 'all' | 'Asia' | 'Europe' | 'Americas' | 'Africa' | 'Oceania'

// ==================== 常量 ====================
const COUNTRIES_API = 'https://restcountries.com/v3.1/all'
const CACHE_KEY = 'country-info-cache'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24小时缓存

const REGIONS: { key: RegionFilter; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '🌍' },
  { key: 'Asia', label: '亚洲', icon: '🌏' },
  { key: 'Europe', label: '欧洲', icon: '🌍' },
  { key: 'Americas', label: '美洲', icon: '🌎' },
  { key: 'Africa', label: '非洲', icon: '🌍' },
  { key: 'Oceania', label: '大洋洲', icon: '🌏' },
]

// ==================== 工具函数 ====================
function formatPopulation(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toString()
}

function formatArea(num: number): string {
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M km²`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K km²`
  return `${num} km²`
}

function getCountryDetail(country: Country, allCountries: Country[]): CountryDetail {
  const currencyList = country.currencies
    ? Object.entries(country.currencies).map(([_, c]) => ({
        name: c.name,
        symbol: c.symbol || '',
      }))
    : []

  const languageList = country.languages ? Object.values(country.languages) : []

  const borderCountries = country.borders
    ? country.borders
        .map((code) => allCountries.find((c) => c.cca3 === code)?.name.common || code)
        .slice(0, 10)
    : []

  return {
    ...country,
    currencyList,
    languageList,
    borderCountries,
  }
}

// ==================== 主组件 ====================
export default function CountryInfo() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // ==================== 缓存机制 ====================
  const getCachedData = useCallback((): { data: Country[]; timestamp: number } | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || !Array.isArray(parsed.data)) return null
      return parsed
    } catch {
      return null
    }
  }, [])

  const setCache = useCallback((data: Country[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
    } catch {
      // ignore
    }
  }, [])

  // ==================== 数据获取 ====================
  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 检查缓存
      const cached = getCachedData()
      const now = Date.now()
      if (cached && now - cached.timestamp < CACHE_TTL) {
        setCountries(cached.data)
        setLastUpdated(new Date(cached.timestamp))
        setLoading(false)
        return
      }

      // 从API获取
      const response = await fetch(COUNTRIES_API)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const formatted: Country[] = (data as any[]).map((c) => ({
        cca3: c.cca3,
        name: c.name,
        flags: c.flags,
        capital: c.capital,
        population: c.population,
        area: c.area || 0,
        region: c.region,
        subregion: c.subregion,
        currencies: c.currencies,
        languages: c.languages,
        timezones: c.timezones,
        borders: c.borders,
        latlng: c.latlng,
      }))

      setCountries(formatted)
      setCache(formatted)
      setLastUpdated(new Date())
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(`获取国家数据失败：${msg}`)

      // 尝试使用缓存
      const cached = getCachedData()
      if (cached && cached.data.length > 0) {
        setCountries(cached.data)
        setLastUpdated(new Date(cached.timestamp))
      }
    } finally {
      setLoading(false)
    }
  }, [getCachedData, setCache])

  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  // ==================== 搜索、筛选、排序 ====================
  const filteredSortedCountries = useMemo(() => {
    // 搜索过滤
    let filtered = countries.filter(
      (c) =>
        c.name.common.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.official.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.capital && c.capital.some((cap) => cap.toLowerCase().includes(searchQuery.toLowerCase())))
    )

    // 区域筛选
    if (regionFilter !== 'all') {
      filtered = filtered.filter((c) => c.region === regionFilter)
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      let va: number | string = 0
      let vb: number | string = 0
      switch (sortKey) {
        case 'population':
          va = a.population
          vb = b.population
          break
        case 'area':
          va = a.area
          vb = b.area
          break
        case 'name':
          va = a.name.common
          vb = b.name.common
          break
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })

    return sorted
  }, [countries, searchQuery, regionFilter, sortKey, sortDir])

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }, [sortKey])

  const handleCountryClick = useCallback(
    (country: Country) => {
      const detail = getCountryDetail(country, countries)
      setSelectedCountry(detail)
    },
    [countries]
  )

  const sortIndicator = useCallback(
    (key: SortKey) => {
      if (sortKey !== key) return ' ↕'
      return sortDir === 'asc' ? ' ▲' : ' ▼'
    },
    [sortKey, sortDir]
  )

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  // ==================== 渲染 ====================
  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--window-bg)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--window-border)',
          background: 'var(--titlebar-bg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px' }}>🌍 国家信息浏览器</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '12px' }}>
              {lastUpdated ? `最后更新: ${formatDate(lastUpdated)} · ${countries.length} 个国家` : '加载中...'}
            </p>
          </div>
          <button
            onClick={fetchCountries}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            🔄 刷新
          </button>
        </div>

        {/* 搜索框 */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索国家名称或首都..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--window-border)',
            background: '#2a2a3e',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
          }}
        />

        {/* 区域筛选 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          {REGIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRegionFilter(r.key)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border:
                  regionFilter === r.key
                    ? '1px solid var(--accent)'
                    : '1px solid var(--window-border)',
                background:
                  regionFilter === r.key ? 'var(--accent-bg)' : 'transparent',
                color: regionFilter === r.key ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: regionFilter === r.key ? 600 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              {r.icon} {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {/* 错误提示 */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(248,113,113,0.1)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '12px',
              marginBottom: '10px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* 加载状态 */}
        {loading && countries.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>🌍</div>
            <div>正在加载全球国家数据...</div>
          </div>
        ) : (
          <>
            {/* 结果统计 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                找到 {filteredSortedCountries.length} 个国家
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => toggleSort('name')}
                  style={{
                    background: sortKey === 'name' ? 'var(--accent-bg)' : 'transparent',
                    border: '1px solid var(--window-border)',
                    color: sortKey === 'name' ? 'var(--accent)' : 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  名称{sortIndicator('name')}
                </button>
                <button
                  onClick={() => toggleSort('population')}
                  style={{
                    background: sortKey === 'population' ? 'var(--accent-bg)' : 'transparent',
                    border: '1px solid var(--window-border)',
                    color: sortKey === 'population' ? 'var(--accent)' : 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  人口{sortIndicator('population')}
                </button>
                <button
                  onClick={() => toggleSort('area')}
                  style={{
                    background: sortKey === 'area' ? 'var(--accent-bg)' : 'transparent',
                    border: '1px solid var(--window-border)',
                    color: sortKey === 'area' ? 'var(--accent)' : 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  面积{sortIndicator('area')}
                </button>
              </div>
            </div>

            {/* 国家列表 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {filteredSortedCountries.map((country) => (
                <div
                  key={country.cca3}
                  onClick={() => handleCountryClick(country)}
                  style={{
                    background: '#2a2a3e',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease, transform 0.2s ease',
                    border: '1px solid var(--window-border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3a3a4e'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#2a2a3e'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <img
                      src={country.flags.svg}
                      alt={country.flags.alt || country.name.common}
                      style={{
                        width: '48px',
                        height: '32px',
                        borderRadius: '4px',
                        objectFit: 'cover',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: 'var(--text-primary)',
                          fontWeight: '600',
                          fontSize: '14px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {country.name.common}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                        {country.region}
                        {country.subregion ? ` · ${country.subregion}` : ''}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>首都</div>
                      <div style={{ color: 'var(--text-primary)' }}>
                        {country.capital?.[0] || '无'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>人口</div>
                      <div style={{ color: 'var(--text-primary)' }}>
                        {formatPopulation(country.population)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>面积</div>
                      <div style={{ color: 'var(--text-primary)' }}>
                        {formatArea(country.area)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>货币</div>
                      <div style={{ color: 'var(--text-primary)' }}>
                        {country.currencies
                          ? Object.keys(country.currencies)
                              .slice(0, 2)
                              .map((k) => country.currencies![k].symbol || k)
                              .join(', ')
                          : '无'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 无结果 */}
            {filteredSortedCountries.length === 0 && !loading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <div>未找到匹配的国家</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 国家详情模态框 */}
      {selectedCountry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedCountry(null)}
        >
          <div
            style={{
              background: 'var(--window-bg)',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--window-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px' }}>
              {/* 头部 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src={selectedCountry.flags.svg}
                    alt={selectedCountry.flags.alt || selectedCountry.name.common}
                    style={{
                      width: '80px',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px', fontWeight: '700' }}>
                      {selectedCountry.name.common}
                    </h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                      {selectedCountry.name.official}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '6px' }}>
                      {selectedCountry.region}
                      {selectedCountry.subregion ? ` · ${selectedCountry.subregion}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCountry(null)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#3a3a4e',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* 基本信息 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    background: '#2a2a3e',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    🏛️ 首都
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {selectedCountry.capital?.join(', ') || '无'}
                  </div>
                </div>
                <div
                  style={{
                    background: '#2a2a3e',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    👥 人口
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {selectedCountry.population.toLocaleString('zh-CN')}
                  </div>
                </div>
                <div
                  style={{
                    background: '#2a2a3e',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    📐 面积
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {selectedCountry.area.toLocaleString('zh-CN')} km²
                  </div>
                </div>
                <div
                  style={{
                    background: '#2a2a3e',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    📍 地理位置
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {selectedCountry.latlng
                      ? `${selectedCountry.latlng[0].toFixed(2)}°, ${selectedCountry.latlng[1].toFixed(2)}°`
                      : '无数据'}
                  </div>
                </div>
              </div>

              {/* 货币 */}
              {selectedCountry.currencyList.length > 0 && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,108,240,0.1), rgba(79,70,229,0.05))',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '1px solid rgba(124,108,240,0.2)',
                  }}
                >
                  <div style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                    💰 货币
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCountry.currencyList.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            background: 'var(--accent-bg)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--accent)',
                          }}
                        >
                          {c.symbol || '—'}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 语言 */}
              {selectedCountry.languageList.length > 0 && (
                <div
                  style={{
                    background: '#2a2a3e',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                    🗣️ 语言
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedCountry.languageList.map((lang, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 时区 */}
              {selectedCountry.timezones && selectedCountry.timezones.length > 0 && (
                <div
                  style={{
                    background: '#2a2a3e',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                    🕐 时区 ({selectedCountry.timezones.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedCountry.timezones.slice(0, 8).map((tz, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {tz}
                      </span>
                    ))}
                    {selectedCountry.timezones.length > 8 && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                        +{selectedCountry.timezones.length - 8} 更多
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 边界国家 */}
              {selectedCountry.borderCountries.length > 0 && (
                <div
                  style={{
                    background: '#2a2a3e',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '1px solid var(--window-border)',
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                    🗺️ 边界国家 ({selectedCountry.borderCountries.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedCountry.borderCountries.map((b, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          const country = countries.find((c) => c.name.common === b)
                          if (country) handleCountryClick(country)
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(124,108,240,0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}