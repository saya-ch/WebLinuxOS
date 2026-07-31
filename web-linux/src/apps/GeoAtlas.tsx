import { useState, useEffect, useCallback, useMemo } from 'react'

// ==================== 类型定义 ====================
interface Country {
  cca2: string
  name: { common: string; official: string }
  flags: { svg: string; alt?: string }
  capital?: string[]
  population: number
  area: number
  region: string
  subregion?: string
  languages?: { [k: string]: string }
  currencies?: { [k: string]: { name: string; symbol?: string } }
  timezones?: string[]
  borders?: string[]
  latlng?: [number, number]
  continents?: string[]
  coatOfArms?: { svg?: string; png?: string }
  car?: { signs?: string[]; side?: string }
  status?: string
  unMember?: boolean
  independent?: boolean
  landlocked?: boolean
}

interface RegionStats {
  region: string
  totalCountries: number
  totalPopulation: number
  avgArea: number
  mostCommonLanguage: string
  largestCountry: string
  smallestCountry: string
}

interface QuizQuestion {
  type: 'flag' | 'capital' | 'region'
  question: string
  answer: string
  options: string[]
  flagSvg?: string
  hint?: string
}

type TabKey = 'explorer' | 'compare' | 'quiz' | 'stats' | 'favorites'
type RegionFilter = 'all' | 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania'

// ==================== 常量 ====================
const API_BASE = 'https://restcountries.com/v3.1'
const CACHE_KEY = 'geo-atlas-cache'
const CACHE_TTL = 24 * 60 * 60 * 1000
const FAV_KEY = 'geo-atlas-favorites'

const REGIONS: { key: RegionFilter; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '🌐' },
  { key: 'Africa', label: '非洲', icon: '🌍' },
  { key: 'Americas', label: '美洲', icon: '🌎' },
  { key: 'Asia', label: '亚洲', icon: '🌏' },
  { key: 'Europe', label: '欧洲', icon: '🏰' },
  { key: 'Oceania', label: '大洋洲', icon: '🏝️' },
]

// ==================== 颜色主题 ====================
const C = {
  bg: '#0a0a18',
  bgSec: '#12122a',
  accent: '#8b7cf0',
  accentLight: '#a99cf6',
  accentDark: '#6b5cd0',
  accentBg: 'rgba(139,124,240,0.12)',
  text: '#e2e8f0',
  textSec: '#a0aec0',
  glass: 'rgba(18,18,42,0.75)',
  glassBorder: 'rgba(139,124,240,0.2)',
  success: '#68d391',
  danger: '#fc8181',
  warning: '#f6ad55',
  card: 'rgba(18,18,42,0.6)',
  cardHover: 'rgba(30,30,60,0.8)',
}

// ==================== 工具函数 ====================
function fmtPop(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toString()
}

function fmtArea(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M km²`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K km²`
  return `${n.toLocaleString()} km²`
}

function fmtNum(n: number): string {
  return n.toLocaleString('zh-CN')
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getLangList(c: Country): string[] {
  return c.languages ? Object.values(c.languages) : []
}

function getCurrencyList(c: Country): { name: string; symbol: string }[] {
  return c.currencies
    ? Object.entries(c.currencies).map(([, v]) => ({ name: v.name, symbol: v.symbol || '' }))
    : []
}

// ==================== 样式对象 ====================
const S = {
  container: {
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${C.bg} 0%, ${C.bgSec} 50%, #0d0d22 100%)`,
    color: C.text,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  header: {
    padding: '14px 20px',
    borderBottom: `1px solid ${C.glassBorder}`,
    background: C.glass,
    backdropFilter: 'blur(12px)',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.5,
    background: `linear-gradient(90deg, ${C.accentLight}, ${C.accent})`,
    WebkitBackgroundClip: 'text' as any,
    WebkitTextFillColor: 'transparent' as any,
    margin: 0,
  },
  subtitle: {
    fontSize: 11,
    color: C.textSec,
    marginTop: 3,
  },
  tabsBar: {
    display: 'flex',
    gap: 4,
    padding: '8px 16px',
    borderBottom: `1px solid ${C.glassBorder}`,
    background: 'rgba(10,10,24,0.5)',
    flexWrap: 'wrap' as const,
  },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '7px 14px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    background: active
      ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`
      : 'rgba(255,255,255,0.04)',
    color: active ? '#fff' : C.textSec,
    transition: 'all 0.25s',
    outline: 'none',
    boxShadow: active ? `0 4px 14px rgba(139,124,240,0.35)` : 'none',
  }),
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
  },
  card: {
    background: C.card,
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 12,
    padding: 16,
    backdropFilter: 'blur(6px)',
    transition: 'all 0.25s',
  },
  input: {
    width: '100%',
    padding: '9px 14px',
    borderRadius: 10,
    border: `1px solid ${C.glassBorder}`,
    background: 'rgba(20,20,50,0.6)',
    color: C.text,
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btnPrimary: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
    color: '#fff',
    transition: 'all 0.2s',
  },
  btnGhost: {
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${C.glassBorder}`,
    cursor: 'pointer',
    fontSize: 12,
    background: 'transparent',
    color: C.textSec,
    transition: 'all 0.2s',
  },
  pill: (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: 20,
    border: active ? `1px solid ${C.accent}` : `1px solid ${C.glassBorder}`,
    background: active ? C.accentBg : 'transparent',
    color: active ? C.accent : C.textSec,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: active ? 600 : 400,
    transition: 'all 0.2s',
  }),
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
  },
  skeleton: {
    background: 'linear-gradient(90deg, rgba(139,124,240,0.06) 25%, rgba(139,124,240,0.12) 50%, rgba(139,124,240,0.06) 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 8,
    animation: 'geoShimmer 1.5s infinite',
  },
}

// ==================== 骨架屏 ====================
function SkeletonBlock({ w = '100%', h = 20 }: { w?: string; h?: number }) {
  return <div style={{ ...S.skeleton, width: w, height: h }} />
}

function CountryCardSkeleton() {
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <SkeletonBlock w="48px" h={32} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock w="70%" h={14} />
          <SkeletonBlock w="40%" h={10} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <SkeletonBlock h={10} />
        <SkeletonBlock h={10} />
        <SkeletonBlock h={10} />
        <SkeletonBlock h={10} />
      </div>
    </div>
  )
}

// ==================== 主组件 ====================
export default function GeoAtlas() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('explorer')
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState<RegionFilter>('all')

  // 详情
  const [detail, setDetail] = useState<Country | null>(null)

  // 对比
  const [compareIds, setCompareIds] = useState<string[]>([])

  // 测验
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null)
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 })
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [quizRevealed, setQuizRevealed] = useState(false)

  // 收藏
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  // ==================== 缓存 ====================
  const getCache = useCallback((): { data: Country[]; ts: number } | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const p = JSON.parse(raw)
      return Array.isArray(p?.data) ? p : null
    } catch { return null }
  }, [])

  const setCache = useCallback((data: Country[]) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch {}
  }, [])

  // ==================== 数据获取 ====================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const cached = getCache()
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setCountries(cached.data)
        setLoading(false)
        return
      }
      const res = await fetch(`${API_BASE}/all?fields=name,capital,region,subregion,population,area,flags,cca2,languages,currencies,timezones,borders,latlng,continents,car,status,unMember,independent,landlocked,coatOfArms`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json()
      const list: Country[] = (raw as any[]).map((c: any) => ({
        cca2: c.cca2,
        name: c.name,
        flags: c.flags,
        capital: c.capital,
        population: c.population,
        area: c.area || 0,
        region: c.region,
        subregion: c.subregion,
        languages: c.languages,
        currencies: c.currencies,
        timezones: c.timezones,
        borders: c.borders,
        latlng: c.latlng,
        continents: c.continents,
        car: c.car,
        status: c.status,
        unMember: c.unMember,
        independent: c.independent,
        landlocked: c.landlocked,
        coatOfArms: c.coatOfArms,
      }))
      setCountries(list)
      setCache(list)
    } catch (err) {
      setError(`获取数据失败：${err instanceof Error ? err.message : '未知错误'}`)
      const cached = getCache()
      if (cached?.data.length) setCountries(cached.data)
    } finally {
      setLoading(false)
    }
  }, [getCache, setCache])

  useEffect(() => { fetchData() }, [fetchData])

  // ==================== 收藏管理 ====================
  const toggleFav = useCallback((cca2: string) => {
    setFavorites(prev => {
      const next = prev.includes(cca2) ? prev.filter(x => x !== cca2) : [...prev, cca2]
      try { localStorage.setItem(FAV_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const isFav = useCallback((cca2: string) => favorites.includes(cca2), [favorites])

  // ==================== 过滤排序 ====================
  const filtered = useMemo(() => {
    let list = countries.filter(c =>
      c.name.common.toLowerCase().includes(search.toLowerCase()) ||
      c.name.official.toLowerCase().includes(search.toLowerCase()) ||
      (c.capital && c.capital.some(cap => cap.toLowerCase().includes(search.toLowerCase())))
    )
    if (region !== 'all') list = list.filter(c => c.region === region)
    return list.sort((a, b) => a.name.common.localeCompare(b.name.common))
  }, [countries, search, region])

  // ==================== 区域统计 ====================
  const regionStats = useMemo((): RegionStats[] => {
    const regionNames = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']
    return regionNames.map(r => {
      const rc = countries.filter(c => c.region === r)
      const totalPop = rc.reduce((s, c) => s + c.population, 0)
      const avgArea = rc.length ? rc.reduce((s, c) => s + c.area, 0) / rc.length : 0
      // 最常见语言
      const langCount: Record<string, number> = {}
      rc.forEach(c => { if (c.languages) Object.values(c.languages).forEach(l => { langCount[l] = (langCount[l] || 0) + 1 }) })
      const topLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]
      // 最大最小
      const byPop = [...rc].sort((a, b) => b.population - a.population)
      return {
        region: r,
        totalCountries: rc.length,
        totalPopulation: totalPop,
        avgArea,
        mostCommonLanguage: topLang ? `${topLang[0]} (${topLang[1]})` : '无数据',
        largestCountry: byPop[0]?.name.common || '无',
        smallestCountry: byPop[byPop.length - 1]?.name.common || '无',
      }
    })
  }, [countries])

  // ==================== 测验 ====================
  const generateQuiz = useCallback(() => {
    if (countries.length < 4) return
    const pool = countries.filter(c => c.capital && c.capital[0])
    const types: ('flag' | 'capital' | 'region')[] = ['flag', 'capital', 'region']
    const type = types[Math.floor(Math.random() * types.length)]
    const target = pool[Math.floor(Math.random() * pool.length)]

    let question = ''
    let answer = ''
    let hint = ''
    let flagSvg: string | undefined

    if (type === 'flag') {
      question = '这个国旗属于哪个国家？'
      answer = target.name.common
      flagSvg = target.flags.svg
      hint = target.region
    } else if (type === 'capital') {
      question = `${target.capital![0]} 是哪个国家的首都？`
      answer = target.name.common
      hint = target.region
    } else {
      question = `以下哪个国家位于 ${target.region}？`
      answer = target.name.common
      hint = target.subregion || ''
    }

    // 生成4个选项（含正确答案）
    const others = pool.filter(c => c.cca2 !== target.cca2)
    const wrongOpts = shuffle(others).slice(0, 3).map(c => c.name.common)
    const options = shuffle([answer, ...wrongOpts])

    setQuiz({ type, question, answer, options, flagSvg, hint })
    setQuizRevealed(false)
    setQuizAnswer(null)
  }, [countries])

  const handleQuizAnswer = useCallback((opt: string) => {
    if (quizRevealed) return
    setQuizAnswer(opt)
    setQuizRevealed(true)
    setQuizScore(prev => ({
      correct: prev.correct + (opt === quiz?.answer ? 1 : 0),
      total: prev.total + 1,
    }))
  }, [quiz, quizRevealed])

  // ==================== 对比 ====================
  const toggleCompare = useCallback((cca2: string) => {
    setCompareIds(prev => {
      if (prev.includes(cca2)) return prev.filter(x => x !== cca2)
      if (prev.length >= 3) return prev
      return [...prev, cca2]
    })
  }, [])

  const compareCountries = useMemo(
    () => compareIds.map(id => countries.find(c => c.cca2 === id)).filter(Boolean) as Country[],
    [compareIds, countries]
  )

  // ==================== 地图URL ====================
  const getMapUrl = useCallback((c: Country) => {
    if (!c.latlng) return ''
    const [lat, lng] = c.latlng
    const d = Math.max(5, Math.min(30, Math.sqrt(c.area) / 10))
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`
  }, [])

  // ==================== 渲染标签 ====================
  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'explorer', label: '国家探索', icon: '🔍' },
    { key: 'compare', label: '对比模式', icon: '⚖️' },
    { key: 'quiz', label: '地理测验', icon: '🎯' },
    { key: 'stats', label: '区域统计', icon: '📊' },
    { key: 'favorites', label: '收藏夹', icon: '⭐' },
  ]

  // ==================== 渲染 ====================
  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={S.title}>🌐 GeoAtlas 地理图鉴</h2>
            <p style={S.subtitle}>
              {loading ? '加载中...' : `${countries.length} 个国家 · REST Countries API`}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              ...S.btnPrimary,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabsBar}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={S.tab(tab === t.key)}>
            {t.icon} {t.label}
            {t.key === 'favorites' && favorites.length > 0 && (
              <span style={{
                marginLeft: 4,
                background: C.accent,
                color: '#fff',
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: 10,
                fontWeight: 700,
              }}>{favorites.length}</span>
            )}
            {t.key === 'compare' && compareIds.length > 0 && (
              <span style={{
                marginLeft: 4,
                background: C.accent,
                color: '#fff',
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: 10,
                fontWeight: 700,
              }}>{compareIds.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={S.content}>
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(252,129,129,0.1)',
            borderRadius: 8,
            color: C.danger,
            fontSize: 12,
            marginBottom: 10,
            border: '1px solid rgba(252,129,129,0.2)',
          }}>⚠️ {error}</div>
        )}

        {/* ==================== EXPLORER TAB ==================== */}
        {tab === 'explorer' && (
          <>
            {/* Search & Filter */}
            <div style={{ marginBottom: 14 }}>
              <input
                style={S.input}
                placeholder="搜索国家名称、首都..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = C.accent }}
                onBlur={e => { e.currentTarget.style.borderColor = C.glassBorder }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {REGIONS.map(r => (
                  <button key={r.key} onClick={() => setRegion(r.key)} style={S.pill(region === r.key)}>
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ color: C.textSec, fontSize: 11 }}>
                  找到 {filtered.length} 个国家
                </span>
                {compareIds.length > 0 && (
                  <span style={{ color: C.accent, fontSize: 11 }}>
                    已选 {compareIds.length}/3 个对比
                  </span>
                )}
              </div>
            </div>

            {/* Loading */}
            {loading && countries.length === 0 ? (
              <div style={S.grid2}>
                {Array.from({ length: 12 }).map((_, i) => <CountryCardSkeleton key={i} />)}
              </div>
            ) : (
              <div style={S.grid2}>
                {filtered.map(c => (
                  <div
                    key={c.cca2}
                    onClick={() => setDetail(c)}
                    style={{
                      ...S.card,
                      cursor: 'pointer',
                      position: 'relative' as const,
                      border: compareIds.includes(c.cca2)
                        ? `1px solid ${C.accent}`
                        : isFav(c.cca2)
                          ? `1px solid ${C.warning}`
                          : `1px solid ${C.glassBorder}`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = C.cardHover
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = `0 8px 24px rgba(139,124,240,0.15)`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = C.card
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Fav indicator */}
                    {isFav(c.cca2) && (
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 14 }}>⭐</span>
                    )}
                    {/* Compare indicator */}
                    {compareIds.includes(c.cca2) && (
                      <span style={{
                        position: 'absolute', top: 8, right: isFav(c.cca2) ? 28 : 8,
                        fontSize: 10, background: C.accent, color: '#fff',
                        borderRadius: 10, padding: '1px 6px', fontWeight: 700,
                      }}>对比</span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <img
                        src={c.flags.svg}
                        alt={c.flags.alt || c.name.common}
                        style={{ width: 44, height: 30, borderRadius: 4, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                        loading="lazy"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name.common}
                        </div>
                        <div style={{ color: C.textSec, fontSize: 10 }}>
                          {c.region}{c.subregion ? ` · ${c.subregion}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                      <div>
                        <div style={{ color: C.textSec, fontSize: 9 }}>首都</div>
                        <div style={{ color: C.text }}>{c.capital?.[0] || '—'}</div>
                      </div>
                      <div>
                        <div style={{ color: C.textSec, fontSize: 9 }}>人口</div>
                        <div style={{ color: C.text }}>{fmtPop(c.population)}</div>
                      </div>
                      <div>
                        <div style={{ color: C.textSec, fontSize: 9 }}>面积</div>
                        <div style={{ color: C.text }}>{fmtArea(c.area)}</div>
                      </div>
                      <div>
                        <div style={{ color: C.textSec, fontSize: 9 }}>语言</div>
                        <div style={{ color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getLangList(c).slice(0, 2).join(', ') || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && !loading && (
                  <div style={{ textAlign: 'center', padding: 40, color: C.textSec, gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                    <div>未找到匹配的国家</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ==================== COMPARE TAB ==================== */}
        {tab === 'compare' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: C.textSec, fontSize: 12, margin: '0 0 10px 0' }}>
                在「国家探索」中点击国家卡片右上角选择最多3个国家进行对比，或直接在下方搜索添加
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  style={{ ...S.input, width: 240 }}
                  placeholder="输入国家名称添加到对比..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim()
                      const found = countries.find(c =>
                        c.name.common.toLowerCase() === val.toLowerCase() ||
                        c.name.official.toLowerCase() === val.toLowerCase()
                      )
                      if (found && !compareIds.includes(found.cca2) && compareIds.length < 3) {
                        toggleCompare(found.cca2)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />
                {compareIds.length > 0 && (
                  <button onClick={() => setCompareIds([])} style={S.btnGhost}>清空对比</button>
                )}
              </div>
            </div>

            {compareCountries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.textSec }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>⚖️</div>
                <div>尚未选择任何国家进行对比</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>请先到「国家探索」中点击卡片选择国家</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  fontSize: 12,
                }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        color: C.textSec,
                        borderBottom: `1px solid ${C.glassBorder}`,
                        background: 'rgba(10,10,24,0.5)',
                        position: 'sticky',
                        top: 0,
                      }}>属性</th>
                      {compareCountries.map(c => (
                        <th key={c.cca2} style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          color: C.text,
                          fontWeight: 600,
                          borderBottom: `1px solid ${C.glassBorder}`,
                          background: 'rgba(10,10,24,0.5)',
                          position: 'sticky',
                          top: 0,
                          minWidth: 180,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={c.flags.svg} alt="" style={{ width: 28, height: 18, borderRadius: 3, objectFit: 'cover' }} />
                            {c.name.common}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleCompare(c.cca2) }}
                              style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 14, padding: 0 }}
                            >✕</button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      ['🏛️ 首都', (c: Country) => c.capital?.join(', ') || '—'],
                      ['👥 人口', (c: Country) => fmtNum(c.population)],
                      ['📐 面积', (c: Country) => fmtArea(c.area)],
                      ['🌍 区域', (c: Country) => `${c.region}${c.subregion ? ` · ${c.subregion}` : ''}`],
                      ['🗣️ 语言', (c: Country) => getLangList(c).join(', ') || '—'],
                      ['💰 货币', (c: Country) => getCurrencyList(c).map(x => `${x.symbol} ${x.name}`).join(', ') || '—'],
                      ['🕐 时区', (c: Country) => c.timezones?.slice(0, 3).join(', ') || '—'],
                      ['🗺️ 邻国', (c: Country) => {
                        if (!c.borders?.length) return '岛国/无邻国'
                        return c.borders.slice(0, 5).map(b => {
                          const found = countries.find(x => x.cca2 === b)
                          return found ? found.name.common : b
                        }).join(', ')
                      }],
                      ['🚗 车牌', (c: Country) => c.car?.signs?.join(', ') || '—'],
                      ['🚗 靠右/左', (c: Country) => c.car?.side === 'left' ? '靠左行驶' : '靠右行驶'],
                      ['🏔️ 内陆', (c: Country) => c.landlocked ? '是' : '否'],
                      ['🇺🇳 联合国', (c: Country) => c.unMember ? '是' : '否'],
                    ] as [string, (c: Country) => string][]).map(([label, fn], i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(139,124,240,0.03)' }}>
                        <td style={{
                          padding: '10px 14px',
                          color: C.textSec,
                          borderBottom: `1px solid rgba(139,124,240,0.08)`,
                          whiteSpace: 'nowrap',
                        }}>{label}</td>
                        {compareCountries.map(c => (
                          <td key={c.cca2} style={{
                            padding: '10px 14px',
                            color: C.text,
                            borderBottom: `1px solid rgba(139,124,240,0.08)`,
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>{fn(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== QUIZ TAB ==================== */}
        {tab === 'quiz' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {/* Score */}
            <div style={{
              ...S.card,
              display: 'flex',
              justifyContent: 'space-around',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.success }}>{quizScore.correct}</div>
                <div style={{ fontSize: 11, color: C.textSec }}>正确</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{quizScore.total}</div>
                <div style={{ fontSize: 11, color: C.textSec }}>总题数</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.accent }}>
                  {quizScore.total ? Math.round(quizScore.correct / quizScore.total * 100) : 0}%
                </div>
                <div style={{ fontSize: 11, color: C.textSec }}>正确率</div>
              </div>
            </div>

            {!quiz ? (
              <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                <div style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>地理知识测验</div>
                <div style={{ color: C.textSec, fontSize: 12, marginBottom: 20 }}>
                  通过国旗、首都或区域来猜国家，每次4个选项
                </div>
                <button onClick={generateQuiz} style={{ ...S.btnPrimary, padding: '12px 28px', fontSize: 14 }}>
                  🚀 开始测验
                </button>
              </div>
            ) : (
              <div style={S.card}>
                {/* Flag display */}
                {quiz.type === 'flag' && quiz.flagSvg && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <img
                      src={quiz.flagSvg}
                      alt="国旗"
                      style={{
                        maxWidth: 200,
                        maxHeight: 130,
                        borderRadius: 8,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  </div>
                )}

                {/* Question */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    {quiz.question}
                  </div>
                  {quiz.hint && !quizRevealed && (
                    <div style={{ color: C.textSec, fontSize: 11 }}>提示：{quiz.hint}</div>
                  )}
                </div>

                {/* Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {quiz.options.map((opt, i) => {
                    let bg = 'rgba(255,255,255,0.04)'
                    let border = C.glassBorder
                    let color = C.text
                    if (quizRevealed) {
                      if (opt === quiz.answer) {
                        bg = 'rgba(104,211,145,0.15)'
                        border = C.success
                        color = C.success
                      } else if (opt === quizAnswer && opt !== quiz.answer) {
                        bg = 'rgba(252,129,129,0.15)'
                        border = C.danger
                        color = C.danger
                      }
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => handleQuizAnswer(opt)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 10,
                          border: `1px solid ${border}`,
                          background: bg,
                          color,
                          cursor: quizRevealed ? 'default' : 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                          transition: 'all 0.2s',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ color: C.textSec, marginRight: 6 }}>{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {/* Next button */}
                {quizRevealed && (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={generateQuiz} style={{ ...S.btnPrimary, padding: '10px 24px' }}>
                      下一题 →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== STATS TAB ==================== */}
        {tab === 'stats' && (
          <div>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: '0 0 16px 0' }}>
              📊 各大洲统计数据
            </h3>
            {loading ? (
              <div style={S.grid2}>
                {Array.from({ length: 5 }).map((_, i) => <CountryCardSkeleton key={i} />)}
              </div>
            ) : (
              <div style={S.grid2}>
                {regionStats.map(rs => {
                  const regionIcon = REGIONS.find(r => r.key === rs.region)?.icon || '🌍'
                  const popPercent = countries.length ? (rs.totalPopulation / countries.reduce((s, c) => s + c.population, 0)) * 100 : 0
                  return (
                    <div key={rs.region} style={S.card}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <span style={{ fontSize: 28 }}>{regionIcon}</span>
                        <div>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{rs.region}</div>
                          <div style={{ color: C.textSec, fontSize: 11 }}>{rs.totalCountries} 个国家</div>
                        </div>
                      </div>

                      {/* Population bar */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: C.textSec }}>总人口</span>
                          <span style={{ color: C.text, fontWeight: 600 }}>{fmtPop(rs.totalPopulation)}</span>
                        </div>
                        <div style={{
                          height: 6,
                          borderRadius: 3,
                          background: 'rgba(255,255,255,0.06)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            borderRadius: 3,
                            background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`,
                            width: `${Math.max(2, popPercent)}%`,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                        <div>
                          <div style={{ color: C.textSec, fontSize: 9 }}>平均面积</div>
                          <div style={{ color: C.text }}>{fmtArea(Math.round(rs.avgArea))}</div>
                        </div>
                        <div>
                          <div style={{ color: C.textSec, fontSize: 9 }}>最常见语言</div>
                          <div style={{ color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rs.mostCommonLanguage}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: C.textSec, fontSize: 9 }}>人口最多</div>
                          <div style={{ color: C.success, fontWeight: 600 }}>{rs.largestCountry}</div>
                        </div>
                        <div>
                          <div style={{ color: C.textSec, fontSize: 9 }}>人口最少</div>
                          <div style={{ color: C.warning, fontWeight: 600 }}>{rs.smallestCountry}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* World overview */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <h4 style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>🌐 全球概览</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                <div style={{ background: C.accentBg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{countries.length}</div>
                  <div style={{ fontSize: 10, color: C.textSec }}>国家总数</div>
                </div>
                <div style={{ background: C.accentBg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{fmtPop(countries.reduce((s, c) => s + c.population, 0))}</div>
                  <div style={{ fontSize: 10, color: C.textSec }}>世界人口</div>
                </div>
                <div style={{ background: C.accentBg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{fmtArea(Math.round(countries.reduce((s, c) => s + c.area, 0)))}</div>
                  <div style={{ fontSize: 10, color: C.textSec }}>总面积</div>
                </div>
                <div style={{ background: C.accentBg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>
                    {new Set(countries.flatMap(c => getLangList(c))).size}
                  </div>
                  <div style={{ fontSize: 10, color: C.textSec }}>语言总数</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== FAVORITES TAB ==================== */}
        {tab === 'favorites' && (
          <>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.textSec }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
                <div>还没有收藏的国家</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>在国家详情页中点击 ⭐ 即可收藏</div>
              </div>
            ) : (
              <div style={S.grid2}>
                {countries
                  .filter(c => favorites.includes(c.cca2))
                  .map(c => (
                    <div
                      key={c.cca2}
                      onClick={() => setDetail(c)}
                      style={{
                        ...S.card,
                        cursor: 'pointer',
                        border: `1px solid rgba(246,173,85,0.25)`,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = C.cardHover
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = C.card
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <img src={c.flags.svg} alt="" style={{ width: 44, height: 30, borderRadius: 4, objectFit: 'cover' }} loading="lazy" />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{c.name.common}</div>
                          <div style={{ color: C.textSec, fontSize: 10 }}>{c.capital?.[0] || '—'} · {fmtPop(c.population)}</div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); toggleFav(c.cca2) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}
                        >⭐</button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ==================== COUNTRY DETAIL MODAL ==================== */}
      {detail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setDetail(null)}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${C.bg}, ${C.bgSec})`,
              borderRadius: 16,
              maxWidth: 700,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: `1px solid ${C.glassBorder}`,
              boxShadow: `0 20px 60px rgba(139,124,240,0.2)`,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Detail Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.glassBorder}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img
                    src={detail.flags.svg}
                    alt={detail.flags.alt || detail.name.common}
                    style={{
                      width: 72,
                      height: 'auto',
                      borderRadius: 8,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <div>
                    <h3 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 700 }}>
                      {detail.name.common}
                    </h3>
                    <div style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>{detail.name.official}</div>
                    <div style={{ color: C.textSec, fontSize: 11, marginTop: 4 }}>
                      {detail.region}{detail.subregion ? ` · ${detail.subregion}` : ''}
                      {detail.independent ? ' · 独立国家' : ''}
                      {detail.landlocked ? ' · 内陆国' : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleFav(detail.cca2)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 20,
                      padding: 4,
                    }}
                  >{isFav(detail.cca2) ? '⭐' : '☆'}</button>
                  <button
                    onClick={() => setDetail(null)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: 'none', background: 'rgba(255,255,255,0.08)',
                      color: C.text, cursor: 'pointer', fontSize: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px' }}>
              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                {([
                  ['🏛️ 首都', detail.capital?.join(', ') || '无'],
                  ['👥 人口', fmtNum(detail.population)],
                  ['📐 面积', fmtArea(detail.area)],
                  ['📍 坐标', detail.latlng ? `${detail.latlng[0].toFixed(2)}°, ${detail.latlng[1].toFixed(2)}°` : '无数据'],
                ] as [string, string][]).map(([label, val], i) => (
                  <div key={i} style={{
                    background: 'rgba(20,20,50,0.5)',
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${C.glassBorder}`,
                  }}>
                    <div style={{ color: C.textSec, fontSize: 11, marginBottom: 3 }}>{label}</div>
                    <div style={{ color: C.text, fontWeight: 600 }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Languages */}
              {getLangList(detail).length > 0 && (
                <div style={{
                  background: 'rgba(20,20,50,0.5)',
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 12,
                  border: `1px solid ${C.glassBorder}`,
                }}>
                  <div style={{ color: C.textSec, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>🗣️ 语言</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {getLangList(detail).map((l, i) => (
                      <span key={i} style={{
                        background: 'rgba(255,255,255,0.06)',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        color: C.text,
                      }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Currencies */}
              {getCurrencyList(detail).length > 0 && (
                <div style={{
                  background: `linear-gradient(135deg, rgba(139,124,240,0.08), rgba(139,124,240,0.03))`,
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 12,
                  border: '1px solid rgba(139,124,240,0.15)',
                }}>
                  <div style={{ color: C.accent, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>💰 货币</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {getCurrencyList(detail).map((cur, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          background: C.accentBg,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color: C.accent,
                        }}>{cur.symbol || '—'}</span>
                        <span style={{ color: C.text, fontSize: 12 }}>{cur.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timezones */}
              {detail.timezones && detail.timezones.length > 0 && (
                <div style={{
                  background: 'rgba(20,20,50,0.5)',
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 12,
                  border: `1px solid ${C.glassBorder}`,
                }}>
                  <div style={{ color: C.textSec, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                    🕐 时区 ({detail.timezones.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {detail.timezones.slice(0, 8).map((tz, i) => (
                      <span key={i} style={{
                        background: 'rgba(255,255,255,0.04)',
                        padding: '3px 7px',
                        borderRadius: 4,
                        fontSize: 10,
                        color: C.textSec,
                      }}>{tz}</span>
                    ))}
                    {detail.timezones.length > 8 && (
                      <span style={{ color: C.textSec, fontSize: 10 }}>+{detail.timezones.length - 8} 更多</span>
                    )}
                  </div>
                </div>
              )}

              {/* Borders */}
              {detail.borders && detail.borders.length > 0 && (
                <div style={{
                  background: 'rgba(20,20,50,0.5)',
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 12,
                  border: `1px solid ${C.glassBorder}`,
                }}>
                  <div style={{ color: C.textSec, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                    🗺️ 邻国 ({detail.borders.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {detail.borders.slice(0, 10).map((b, i) => {
                      const found = countries.find(x => x.cca2 === b)
                      const name = found ? found.name.common : b
                      return (
                        <span
                          key={i}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            padding: '5px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            color: C.text,
                            cursor: found ? 'pointer' : 'default',
                            transition: 'background 0.2s',
                          }}
                          onClick={e => {
                            e.stopPropagation()
                            if (found) setDetail(found)
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,124,240,0.2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                        >{name}</span>
                      )
                    })}
                    {detail.borders.length > 10 && (
                      <span style={{ color: C.textSec, fontSize: 11 }}>+{detail.borders.length - 10} 更多</span>
                    )}
                  </div>
                </div>
              )}

              {/* Compare actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  onClick={() => {
                    toggleCompare(detail.cca2)
                    setDetail(null)
                    setTab('compare')
                  }}
                  style={S.btnGhost}
                >
                  ⚖️ {compareIds.includes(detail.cca2) ? '移出对比' : '加入对比'}
                </button>
                <button
                  onClick={() => { toggleFav(detail.cca2) }}
                  style={{
                    ...S.btnGhost,
                    borderColor: isFav(detail.cca2) ? C.warning : C.glassBorder,
                    color: isFav(detail.cca2) ? C.warning : C.textSec,
                  }}
                >
                  {isFav(detail.cca2) ? '⭐ 已收藏' : '☆ 收藏'}
                </button>
              </div>

              {/* Map */}
              {detail.latlng && (
                <div style={{ marginTop: 14, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.glassBorder}` }}>
                  <div style={{ color: C.textSec, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>🗺️ 地图位置</div>
                  <iframe
                    title={`${detail.name.common} map`}
                    src={getMapUrl(detail)}
                    style={{ width: '100%', height: 220, border: 'none', borderRadius: 10, filter: 'invert(90%) hue-rotate(180deg) brightness(0.9) contrast(1.1)' }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ANIMATIONS ==================== */}
      <style>{`
        @keyframes geoShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
