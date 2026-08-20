import { useEffect, useMemo, useState } from 'react'

/* ============================================================
 * EcoTrack · 碳足迹追踪实验室
 *
 * 基于 IPCC 国际公认碳排放因子 + 公开气候数据：
 *  1. 出行（私家车/公交/地铁/骑行/步行/飞机/高铁）排放因子 kgCO2e
 *  2. 饮食（素食/一般/肉食）kgCO2e/天
 *  3. 家庭能耗：电(kWh) / 天然气 / 热水
 *  4. 网购消费：每100元支出的隐含排放估算
 *  5. 接入 Open-Meteo：展示本地实时温度 + 本月历史均温对比（了解气候变化）
 *  6. 本地持久化：30 天记录、目标追踪、SVG 趋势图、分类占比
 *  7. 碳中和换算：需要种多少棵树 / 骑行多少公里能抵消
 *
 * 参考数据：IPCC AR6, DEFRA emission factors, 中国碳核算数据库 CEADs
 * 注意：所有估算仅用于教育和日常参考，不作合规申报用途
 * ============================================================ */

type Tab = 'tracker' | 'history' | 'climate' | 'offset'

type Category = 'transport' | 'food' | 'energy' | 'shopping'

interface FootprintItem {
  id: string
  date: string // ISO date yyyy-mm-dd
  category: Category
  subType: string // label
  amount: number // user input (e.g. km)
  unit: string // e.g. km, kWh, yuan, meals
  co2e: number // kg CO2e
  createdAt: number
}

interface Goal { dailyBudget: number; treesPerYear: number; targetDate: string }
interface WeatherInfo { temp: number; feelsLike: number; wind: number; humidity: number; city: string; monthAvg: number | null }

const REC_KEY = 'ecotrack:records:v1'
const GOAL_KEY = 'ecotrack:goal:v1'
const CITY_KEY = 'ecotrack:city:v1'

/* ====== 排放因子 (kg CO2e 每单位) ====== */
const EMISSION_FACTORS: Record<string, { label: string; category: Category; unit: string; factor: number; icon: string; hint?: string }> = {
  // Transport
  car_petrol:       { label: '私家车（燃油）',   category: 'transport', unit: '公里', factor: 0.192, icon: '🚗', hint: '含油箱到车轮的全周期 192 g/km' },
  car_electric:     { label: '私家车（纯电）',   category: 'transport', unit: '公里', factor: 0.053, icon: '🚙', hint: '电网平均强度下 53 g/km' },
  car_hybrid:       { label: '私家车（混动）',   category: 'transport', unit: '公里', factor: 0.110, icon: '🚘' },
  bus:              { label: '公共汽车',         category: 'transport', unit: '公里', factor: 0.089, icon: '🚌' },
  subway:           { label: '地铁/城轨',        category: 'transport', unit: '公里', factor: 0.038, icon: '🚇' },
  train_hsr:        { label: '高铁',             category: 'transport', unit: '公里', factor: 0.030, icon: '🚄' },
  train_regular:    { label: '普通火车',         category: 'transport', unit: '公里', factor: 0.045, icon: '🚆' },
  flight_domestic:  { label: '飞机（国内）',     category: 'transport', unit: '公里', factor: 0.255, icon: '🛫', hint: '含辐射强迫效应系数 1.9' },
  flight_intl:      { label: '飞机（国际）',     category: 'transport', unit: '公里', factor: 0.195, icon: '✈️' },
  taxi:             { label: '出租车/网约车',    category: 'transport', unit: '公里', factor: 0.210, icon: '🚕' },
  bicycle:          { label: '自行车',           category: 'transport', unit: '公里', factor: 0.000, icon: '🚲', hint: '近乎 0，仅生产/维护间接排放' },
  walk:             { label: '步行',             category: 'transport', unit: '公里', factor: 0.000, icon: '🚶' },

  // Food (per day pattern, or per meal)
  food_meat_heavy:  { label: '肉食为主（每日）', category: 'food',      unit: '天',   factor: 3.30,  icon: '🥩', hint: '约 3.3 kg/天（高肉饮食模型）' },
  food_medium:      { label: '一般饮食（每日）', category: 'food',      unit: '天',   factor: 2.50,  icon: '🍛' },
  food_vegetarian:  { label: '素食（每日）',     category: 'food',      unit: '天',   factor: 1.70,  icon: '🥗' },
  food_vegan:       { label: '纯素（每日）',     category: 'food',      unit: '天',   factor: 1.50,  icon: '🥬' },
  beef_meal:        { label: '一餐（牛肉）',     category: 'food',      unit: '餐',   factor: 6.60,  icon: '🍔', hint: '约 150g 牛肉≈6.6kg CO2e' },
  chicken_meal:     { label: '一餐（鸡肉）',     category: 'food',      unit: '餐',   factor: 1.20,  icon: '🍗' },
  fish_meal:        { label: '一餐（鱼类）',     category: 'food',      unit: '餐',   factor: 1.50,  icon: '🐟' },
  veg_meal:         { label: '一餐（素食）',     category: 'food',      unit: '餐',   factor: 0.80,  icon: '🥦' },
  coffee_cup:       { label: '一杯外带咖啡',     category: 'food',      unit: '杯',   factor: 0.280, icon: '☕', hint: '含奶泡+一次性杯约 280g' },

  // Energy (home)
  elec_kwh:         { label: '家庭用电',         category: 'energy',    unit: 'kWh',  factor: 0.581, icon: '⚡', hint: '中国电网平均 581 gCO2/kWh' },
  gas_m3:           { label: '天然气',           category: 'energy',    unit: '立方米', factor: 2.16, icon: '🔥' },
  water_heat_liter: { label: '热水（洗澡）',     category: 'energy',    unit: '升',   factor: 0.044, icon: '🚿', hint: '电加热平均 44 g CO2/升' },
  ac_hour_1_5:      { label: '空调 1.5匹·1小时', category: 'energy',    unit: '小时', factor: 1.10,  icon: '❄️' },

  // Shopping / consumption (very rough estimate)
  cloth_item:       { label: '服装（件）',       category: 'shopping',  unit: '件',   factor: 12.0,  icon: '👕', hint: '纯棉T恤约 5–15 kg/件' },
  electronics_100:  { label: '电子产品（每100元）', category: 'shopping', unit: '百元', factor: 25.0, icon: '📱', hint: '隐含制造+运输' },
  groceries_100:    { label: '日用品（每100元）', category: 'shopping', unit: '百元', factor: 8.0,  icon: '🛒' },
  delivery_parcel:  { label: '快递包裹（单）',   category: 'shopping',  unit: '件',   factor: 0.95,  icon: '📦' },
  dineout_100:      { label: '外卖/下馆（每100元）', category: 'shopping', unit: '百元', factor: 6.5, icon: '🍽️' },
}

const CATEGORY_META: Record<Category, { label: string; color: string; icon: string }> = {
  transport: { label: '🚗 出行', color: '#3b82f6', icon: '🚗' },
  food:      { label: '🍽️ 饮食', color: '#f59e0b', icon: '🍽️' },
  energy:    { label: '🏠 能源', color: '#10b981', icon: '🏠' },
  shopping:  { label: '🛒 消费', color: '#8b5cf6', icon: '🛒' },
}

/* World avg (not per capita but used as comparison reference) */
const GLOBAL_AVG_DAILY_PER_CAPITA_KG = 6.85 // ≈ 2.5 t CO2e / person / year average for a consumer-country mid-tier; for pure awareness use
const CHINA_AVG_DAILY_KG = 8.2
const TREES_NEEDED_PER_TON_CO2 = 17 // approx mature trees absorbing ~59 kg/yr, long-term storage

function load<T>(k: string, fb: T): T {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : fb } catch { return fb }
}
function save<T>(k: string, v: T) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

function todayISO(): string {
  const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10)
}
function daysAgoISO(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d.toISOString().slice(0,10)
}

export default function EcoTrack() {
  const [tab, setTab] = useState<Tab>('tracker')
  const [records, setRecords] = useState<FootprintItem[]>(() => load(REC_KEY, []))
  const [goal, setGoal] = useState<Goal>(() => load<Goal>(GOAL_KEY, {
    dailyBudget: 7.0, treesPerYear: 5, targetDate: daysAgoISO(-365),
  }))
  const [city, setCity] = useState<string>(() => load(CITY_KEY, 'Beijing'))
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  useEffect(() => { save(REC_KEY, records) }, [records])
  useEffect(() => { save(GOAL_KEY, goal) }, [goal])
  useEffect(() => { save(CITY_KEY, city) }, [city])

  /* ===== Clean old data: keep 90 days ===== */
  useEffect(() => {
    const cutoff = daysAgoISO(90)
    setRecords(prev => {
      const next = prev.filter(r => r.date >= cutoff)
      return next.length === prev.length ? prev : next
    })
  }, [])

  /* ===== Aggregations ===== */
  const todayStr = todayISO()
  const byDate = useMemo(() => {
    const map: Record<string, FootprintItem[]> = {}
    for (const r of records) (map[r.date] ||= []).push(r)
    return map
  }, [records])

  const todayCO2 = useMemo(() => (byDate[todayStr] || []).reduce((s, r) => s + r.co2e, 0), [byDate, todayStr])
  const last30Days = useMemo(() => {
    const arr: Array<{ date: string; co2: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = daysAgoISO(i)
      arr.push({ date: d, co2: (byDate[d] || []).reduce((s, r) => s + r.co2e, 0) })
    }
    return arr
  }, [byDate])
  const total30 = last30Days.reduce((s, d) => s + d.co2, 0)
  const avgPerDay30 = total30 / 30

  const catBreakdown = useMemo(() => {
    const m: Record<Category, number> = { transport: 0, food: 0, energy: 0, shopping: 0 }
    for (const r of records) if (r.date >= daysAgoISO(29)) m[r.category] += r.co2e
    return m
  }, [records])
  const sumCat = catBreakdown.transport + catBreakdown.food + catBreakdown.energy + catBreakdown.shopping || 1

  /* ===== Weather / Climate ===== */
  async function fetchWeather(cityName: string) {
    setWeatherLoading(true); setWeather(null)
    try {
      // Use Open-Meteo geocoding first: simple mapping for common cities to keep offline resilience
      const cityMap: Record<string, [number, number]> = {
        Beijing: [39.9042, 116.4074], Shanghai: [31.2304, 121.4737], Guangzhou: [23.1291, 113.2644],
        Shenzhen: [22.5431, 114.0579], Chengdu: [30.5728, 104.0668], Hangzhou: [30.2741, 120.1551],
        Wuhan: [30.5928, 114.3055], Nanjing: [32.0603, 118.7969], Xian: [34.3416, 108.9398],
        HongKong: [22.3193, 114.1694], Tokyo: [35.6895, 139.6917], Seoul: [37.5665, 126.9780],
        Singapore: [1.3521, 103.8198], London: [51.5074, -0.1278], Paris: [48.8566, 2.3522],
        Berlin: [52.52, 13.405], NewYork: [40.7128, -74.006], LosAngeles: [34.0522, -118.2437],
        Sydney: [-33.8688, 151.2093], Dubai: [25.2048, 55.2708],
      }
      let coord = cityMap[cityName]
      if (!coord) {
        // try geocoding via Open-Meteo
        const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&format=json`)
        const gj = await g.json() as { results?: Array<{ latitude: number; longitude: number; name: string }> }
        if (gj.results?.[0]) {
          coord = [gj.results[0].latitude, gj.results[0].longitude]
          if (gj.results[0].name) setCity(gj.results[0].name)
        }
      }
      if (!coord) throw new Error('未找到该城市坐标')
      const [lat, lon] = coord
      const startDate = daysAgoISO(30)
      const endDate = todayISO()
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m` +
        `&daily=temperature_2m_mean&start_date=${startDate}&end_date=${endDate}&timezone=auto`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const j = (await resp.json()) as {
        current?: { temperature_2m: number; apparent_temperature: number; wind_speed_10m: number; relative_humidity_2m: number }
        daily?: { time: string[]; temperature_2m_mean: (number | null)[] }
      }
      const monthAvgArr = (j.daily?.temperature_2m_mean || []).filter((x): x is number => typeof x === 'number')
      setWeather({
        temp: j.current?.temperature_2m ?? 0,
        feelsLike: j.current?.apparent_temperature ?? 0,
        wind: j.current?.wind_speed_10m ?? 0,
        humidity: j.current?.relative_humidity_2m ?? 0,
        city: cityName,
        monthAvg: monthAvgArr.length ? monthAvgArr.reduce((a,b)=>a+b,0) / monthAvgArr.length : null,
      })
    } catch {
      setWeather(null)
    } finally { setWeatherLoading(false) }
  }
  useEffect(() => { void fetchWeather(city) /* eslint-disable-next-line */ }, [])

  /* ===== Record Actions ===== */
  function addRecord(factorKey: string, amount: number, date = todayISO()) {
    const ef = EMISSION_FACTORS[factorKey]
    if (!ef || !(amount > 0)) return
    const item: FootprintItem = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      date, category: ef.category, subType: ef.label, amount, unit: ef.unit,
      co2e: +(amount * ef.factor).toFixed(3), createdAt: Date.now(),
    }
    setRecords(prev => [item, ...prev])
  }
  function removeRecord(id: string) { setRecords(prev => prev.filter(r => r.id !== id)) }

  /* Tabs data */
  const todayRecords = (byDate[todayStr] || []).slice().sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div style={st.wrap}>
      <header style={st.header}>
        <div style={st.brand}>
          <div style={st.brandMark}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10c0-3.5-3-6.5-6.5-6.5-2 0-3.5 1-3.5 2.5 0 1 1 1.5 1.8 1.5 1 0 1.7.7 1.7 1.7A2.5 2.5 0 1 1 12 17a5 5 0 0 1-5-5 8 8 0 0 1 8-8" />
            </svg>
          </div>
          <div>
            <div style={st.brandTitle}>EcoTrack <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>碳足迹实验室</span></div>
            <div style={st.brandSub}>今日 {todayStr} · {weather ? (weather.temp.toFixed(1) + '°C · ' + weather.city) : '—'}</div>
          </div>
        </div>
        <nav style={st.tabs}>
          {([
            ['tracker', '🌱 记录'],
            ['history', '📊 趋势'],
            ['climate', '🌤️ 气候'],
            ['offset', '🌳 抵消'],
          ] as Array<[Tab, string]>).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...st.tab, ...(tab === k ? st.tabActive : {}) }}>{l}</button>
          ))}
        </nav>
      </header>

      {/* =========== KPI BAR =========== */}
      <section style={st.kpiBar}>
        <KpiCard label="今日排放" value={`${todayCO2.toFixed(2)}`} unit="kg CO₂e"
          color={todayCO2 > goal.dailyBudget ? '#ef4444' : '#10b981'}
          note={`目标 ${goal.dailyBudget.toFixed(1)} kg · ${todayCO2 > goal.dailyBudget ? '超出 ' + (todayCO2 - goal.dailyBudget).toFixed(2) : '剩余 ' + (goal.dailyBudget - todayCO2).toFixed(2)}`}
          icon="📅"
        />
        <KpiCard label="30 天平均" value={avgPerDay30.toFixed(2)} unit="kg/天"
          color={avgPerDay30 > CHINA_AVG_DAILY_KG ? '#f59e0b' : '#10b981'}
          note={`人均参考 中国 ${CHINA_AVG_DAILY_KG.toFixed(1)} · 全球 ${GLOBAL_AVG_DAILY_PER_CAPITA_KG.toFixed(1)}`}
          icon="📈"
        />
        <KpiCard label="30 天累计" value={total30.toFixed(1)} unit="kg CO₂e"
          color="#3b82f6"
          note={`年化约 ${(total30 * 12.17).toFixed(0)} kg = ${(total30 * 12.17 / 1000).toFixed(2)} 吨`}
          icon="🧮"
        />
        <KpiCard label="抵消需要种树" value={(total30 / 1000 * TREES_NEEDED_PER_TON_CO2).toFixed(1)} unit="棵·成熟乔木"
          color="#0891b2"
          note={`每棵树年吸约 59 kg · 种植 ${goal.treesPerYear} 棵/年`}
          icon="🌳"
        />
      </section>

      <main style={st.body}>
        {/* =========== TRACKER =========== */}
        {tab === 'tracker' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 18 }}>
            <section>
              <h3 style={st.h3}>🪵 添加今日活动</h3>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {(['transport','food','energy','shopping'] as Category[]).map(c => (
                  <span key={c} style={{ ...st.catChip, background: `${CATEGORY_META[c].color}18`, color: CATEGORY_META[c].color }}>
                    {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
                  </span>
                ))}
              </div>

              <div style={st.factorGrid}>
                {Object.entries(EMISSION_FACTORS).map(([k, ef]) => (
                  <FactorCard key={k} factorKey={k} ef={ef} onAdd={(amount, date) => addRecord(k, amount, date)} />
                ))}
              </div>
            </section>

            <aside>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ ...st.h3, margin: 0 }}>📋 今日记录 ({todayRecords.length})</h3>
                <label style={st.inlineLabel}>
                  每日预算
                  <input type="number" step="0.1" value={goal.dailyBudget} min="0"
                    onChange={e => setGoal({ ...goal, dailyBudget: Math.max(0, Number(e.target.value) || 0) })}
                    style={st.inlineInput} />kg
                </label>
              </div>

              {/* Ring */}
              <RingProgress value={todayCO2} max={goal.dailyBudget} />

              {todayRecords.length === 0 ? (
                <div style={st.emptyBoxSmall}>还没有今天的数据，选择左侧活动开始记录 🌱</div>
              ) : (
                <div style={st.recordList}>
                  {todayRecords.map(r => (
                    <div key={r.id} style={st.recordRow}>
                      <div style={{ fontSize: 18 }}>{EMISSION_FACTORS[Object.keys(EMISSION_FACTORS).find(k => EMISSION_FACTORS[k].label === r.subType) || 'car_petrol']?.icon || '🌱'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.subType}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {r.amount} {r.unit}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: CATEGORY_META[r.category].color }}>{r.co2e.toFixed(2)} kg</div>
                        <button style={st.iconBtn} onClick={() => removeRecord(r.id)} title="删除">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}

        {/* =========== HISTORY =========== */}
        {tab === 'history' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 18 }}>
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ ...st.h3, margin: 0 }}>📊 30 天每日排放量（kg CO₂e）</h3>
                <label style={st.inlineLabel}>
                  预算线
                  <input type="number" step="0.1" value={goal.dailyBudget} min="0"
                    onChange={e => setGoal({ ...goal, dailyBudget: Math.max(0, Number(e.target.value) || 0) })}
                    style={st.inlineInput} />kg
                </label>
              </div>
              <ThirtyDayChart data={last30Days} budget={goal.dailyBudget} />
              <div style={{ marginTop: 18 }}>
                <h3 style={st.h3}>🧮 30 天分类占比</h3>
                <CategoryDonut breakdown={catBreakdown} sum={sumCat} />
              </div>
            </section>

            <aside>
              <h3 style={st.h3}>🧭 排放明细（近 30 天）</h3>
              {records.filter(r => r.date >= daysAgoISO(29)).length === 0 ? (
                <div style={st.emptyBoxSmall}>暂无数据。</div>
              ) : (
                <div style={{ ...st.recordList, maxHeight: 600, overflow: 'auto' }}>
                  {records
                    .filter(r => r.date >= daysAgoISO(29))
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map(r => (
                      <div key={r.id} style={st.recordRow}>
                        <div style={{
                          width: 4, alignSelf: 'stretch', borderRadius: 3,
                          background: CATEGORY_META[r.category].color,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.subType}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            {r.date} · {r.amount} {r.unit}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: CATEGORY_META[r.category].color }}>{r.co2e.toFixed(2)} kg</div>
                          <button style={st.iconBtn} onClick={() => removeRecord(r.id)}>✕</button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </aside>
          </div>
        )}

        {/* =========== CLIMATE =========== */}
        {tab === 'climate' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 18 }}>
            <section>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <h3 style={{ ...st.h3, margin: 0 }}>🌤️ 本地实时气候 · 数据: Open-Meteo</h3>
                <input value={city} onChange={e => setCity(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') fetchWeather(city) }}
                  placeholder="城市名" style={st.smallInput} />
                <button style={st.btnGhostSmall} onClick={() => fetchWeather(city)} disabled={weatherLoading}>
                  {weatherLoading ? '加载中…' : '查询'}
                </button>
              </div>
              {weatherLoading && <div style={st.emptyBoxSmall}>查询中…</div>}
              {!weatherLoading && !weather && <div style={st.emptyBoxSmall}>未能获取天气数据，请检查网络或稍后重试。</div>}
              {weather && (
                <div style={st.weatherCard}>
                  <div style={st.weatherTemp}>
                    <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }}>{weather.temp.toFixed(1)}°</span>
                    <span style={{ fontSize: 18, marginTop: 12, color: 'var(--text-dim)' }}>{weather.city}</span>
                  </div>
                  <div style={st.weatherGrid}>
                    <div style={st.weatherCell}><span>体感温度</span><strong>{weather.feelsLike.toFixed(1)} °C</strong></div>
                    <div style={st.weatherCell}><span>风速</span><strong>{weather.wind.toFixed(1)} km/h</strong></div>
                    <div style={st.weatherCell}><span>湿度</span><strong>{weather.humidity.toFixed(0)} %</strong></div>
                    <div style={st.weatherCell}><span>本月日均</span><strong>
                      {weather.monthAvg === null ? '—' : weather.monthAvg.toFixed(1) + ' °C'}
                    </strong></div>
                  </div>
                  {weather.monthAvg !== null && (
                    <div style={{ marginTop: 16, padding: 14, borderRadius: 12,
                      background: weather.temp > weather.monthAvg + 2
                        ? 'rgba(239,68,68,0.08)' : weather.temp < weather.monthAvg - 2
                          ? 'rgba(59,130,246,0.08)' : 'rgba(16,185,129,0.08)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🌡️ 与本月历史均温对比</div>
                      <div style={{ fontSize: 15 }}>
                        今天 {weather.temp.toFixed(1)}°C vs 30天平均 {weather.monthAvg.toFixed(1)}°C
                        {weather.temp > weather.monthAvg + 2 && <span style={{ color: '#dc2626', marginLeft: 10 }}>⚠️ 偏暖 {(weather.temp - weather.monthAvg).toFixed(1)}°C — 气候变化信号</span>}
                        {weather.temp < weather.monthAvg - 2 && <span style={{ color: '#2563eb', marginLeft: 10 }}>🧊 偏冷 {(weather.monthAvg - weather.temp).toFixed(1)}°C</span>}
                        {Math.abs(weather.temp - weather.monthAvg) <= 2 && <span style={{ color: '#059669', marginLeft: 10 }}>✅ 在正常范围内</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section>
              <h3 style={st.h3}>🌍 事实档案（数据参考）</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FactBox icon="🌳" title="一棵树一年吸多少碳？"
                  desc="一棵成年阔叶树年均吸收约 15 – 60 kg CO₂；本应用取保守中值 ≈ 59 kg/年（17 棵/吨）。"
                />
                <FactBox icon="🛩️" title="一趟北京-上海往返航班？"
                  desc="单程约 1174 km × 0.255 kg/km ≈ 300 kg/人；往返约 0.6 吨 CO₂e，需要种植 10 棵成熟乔木抵消一年。"
                />
                <FactBox icon="🥩" title="少吃一顿牛肉的效果"
                  desc="一餐 150g 牛肉平均 ≈ 6.6 kg CO₂e ≈ 一辆燃油车行驶 34 公里 ≈ 家庭空调运行 6 小时。"
                />
                <FactBox icon="⚡" title="省 1 度电？"
                  desc="按中国电网平均强度 581 gCO₂/kWh，省 1 度电 ≈ 少排 0.58 kg，相当于骑共享单车替代 3 km 燃油车。"
                />
                <FactBox icon="🛒" title="消费端碳排放 70/30 法则"
                  desc="在发达国家，家庭消费端（食品、物品、出行、住宅）可贡献约 65%–72% 的碳足迹，个人选择真的有意义。"
                />
              </div>
            </section>
          </div>
        )}

        {/* =========== OFFSET =========== */}
        {tab === 'offset' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <section>
              <h3 style={st.h3}>🌳 碳抵消建议（基于你 30 天数据）</h3>
              <div style={st.offsetCard}>
                <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 6 }}>30 天总排放</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: '#ef4444' }}>{total30.toFixed(1)} <span style={{ fontSize: 18 }}>kg CO₂e</span></div>
                <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 6 }}>
                  ≈ {(total30 / 1000).toFixed(3)} 吨 · 年化 {(total30 * 12.17 / 1000).toFixed(2)} 吨
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 16 }}>
                <OffsetTile icon="🌲" title="需要种植成熟乔木" value={`${(total30 / 1000 * TREES_NEEDED_PER_TON_CO2).toFixed(0)}`} unit="棵" sub="年吸收 ≈ 59 kg/棵" />
                <OffsetTile icon="🚲" title="改骑共享单车替代燃油车" value={`${(total30 / 0.192).toFixed(0)}`} unit="km" sub="≈ 减排 0.192 kg/km" />
                <OffsetTile icon="🥬" title="坚持素食" value={`${Math.round(total30 / (3.30 - 1.70))}`} unit="天" sub="相比肉食为主的饮食" />
                <OffsetTile icon="⚡" title="节约家庭用电" value={`${Math.round(total30 / 0.581)}`} unit="kWh" sub="电网平均 0.581 kg/kWh" />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>
                  我承诺每年种植 {goal.treesPerYear} 棵树
                </label>
                <input type="range" min={0} max={100} step={1}
                  value={goal.treesPerYear}
                  onChange={e => setGoal({ ...goal, treesPerYear: Number(e.target.value) })}
                  style={{ width: '100%' }} />
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  按此承诺，您的年度抵消潜力：
                  <strong style={{ marginLeft: 8, color: '#059669' }}>
                    {(goal.treesPerYear * 59).toFixed(0)} kg CO₂e
                  </strong>
                  {goal.treesPerYear * 59 > avgPerDay30 * 365 && <span style={{ color: '#059669', marginLeft: 8 }}>🎉 可完全抵消当前年排放！</span>}
                </div>
              </div>
            </section>

            <section>
              <h3 style={st.h3}>🎯 日常减碳行动清单</h3>
              <ul style={st.actionList}>
                <ActionItem
                  title="每周 2 天素食"
                  impact={2 * 52 * (3.30 - 1.70) / 1000}
                  tip="相当于年减排约 166 kg CO₂e"
                />
                <ActionItem
                  title="上下班改地铁/骑行（每天 15 km）"
                  impact={250 * (0.192 - 0.038) / 1000}
                  tip="一年约减排 610 kg CO₂e"
                />
                <ActionItem
                  title="降低空调 1°C（夏天 26°C 即可）"
                  impact={180 * 1.10 * 0.1 / 1000}
                  tip="制冷能耗降低约 6–8%，年省几十公斤"
                />
                <ActionItem
                  title="每月少一件新衣（延长使用）"
                  impact={12 * 12.0 / 1000}
                  tip="服装全生命周期高排放，少买/二手/置换更环保"
                />
                <ActionItem
                  title="自带杯替代一次性咖啡（每周 4 杯）"
                  impact={208 * 0.280 / 1000}
                  tip="年减排约 58 kg CO₂e，还省钱"
                />
                <ActionItem
                  title="高铁替代 1 次 800km 国内短途飞行"
                  impact={800 * (0.255 - 0.030) / 1000}
                  tip="一次就减约 180 kg CO₂e"
                />
                <ActionItem
                  title="每周 1 次走楼梯 5 层代替电梯"
                  impact={52 * 0.08}
                  tip="电梯每次 5 层约 0.08 kg，健康+环保双赢"
                />
                <ActionItem
                  title="少点 1 次外卖/周（改堂食/自带）"
                  impact={52 * 0.95 / 1000 + 52 * 0.2}
                  tip="约 50 kg/年，含一次性包装和运输排放"
                />
              </ul>
            </section>
          </div>
        )}
      </main>

      <footer style={st.footer}>
        <span>数据来源：IPCC AR6 · DEFRA UK 2023 · 中国 CEADs 均值 · Open-Meteo</span>
        <span>仅用于教育与日常意识参考 · 本地数据不上传</span>
      </footer>
    </div>
  )
}

/* ========== Sub Components ========== */

function FactorCard({ factorKey: _factorKey, ef, onAdd }: {
  factorKey: string
  ef: typeof EMISSION_FACTORS[string]
  onAdd: (amount: number, date?: string) => void
}) {
  const [amount, setAmount] = useState<string>('')
  const meta = CATEGORY_META[ef.category]
  return (
    <div style={{
      ...st.factorCard,
      borderLeft: `4px solid ${meta.color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{ef.icon}</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{ef.label}</span>
        </div>
        <span style={{ fontSize: 11, color: meta.color, whiteSpace: 'nowrap' }}>
          {ef.factor.toFixed(3)} kg/{ef.unit}
        </span>
      </div>
      {ef.hint && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{ef.hint}</div>}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          type="number" min="0" step="any"
          placeholder={`数量（${ef.unit}）`}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { const v = Number(amount); if (v > 0) { onAdd(v); setAmount('') } } }}
          style={st.factorInput}
        />
        <button
          style={st.btnTiny}
          onClick={() => { const v = Number(amount); if (v > 0) { onAdd(v); setAmount('') } }}
        >添加</button>
      </div>
    </div>
  )
}

function KpiCard({ label, value, unit, color, note, icon }: {
  label: string; value: string; unit: string; color: string; note: string; icon: string
}) {
  return (
    <div style={st.kpiCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
        <div style={{ fontSize: 20 }}>{icon}</div>
      </div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{unit}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.4 }}>{note}</div>
    </div>
  )
}

function RingProgress({ value, max }: { value: number; max: number }) {
  const r = 60, C = 2 * Math.PI * r
  const pct = Math.min(1, value / Math.max(0.001, max))
  const color = pct > 1.2 ? '#ef4444' : pct > 1 ? '#f59e0b' : '#10b981'
  return (
    <div style={st.ringWrap}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} stroke="rgba(127,127,127,0.15)" strokeWidth="14" fill="none" />
        <circle cx="90" cy="90" r={r} stroke={color} strokeWidth="14" fill="none"
          strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, pct))}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 500ms ease' }} />
      </svg>
      <div style={st.ringCenter}>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{(pct * 100).toFixed(0)}%</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{value.toFixed(2)} / {max.toFixed(1)} kg</div>
      </div>
    </div>
  )
}

function ThirtyDayChart({ data, budget }: { data: Array<{ date: string; co2: number }>; budget: number }) {
  const W = 800, H = 260, pad = { l: 44, r: 20, t: 20, b: 34 }
  const maxVal = Math.max(budget * 1.1, ...data.map(d => d.co2), 1)
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b
  const barW = innerW / data.length - 4
  return (
    <div style={{ ...st.chartCard, overflowX: 'auto' }}>
      <svg width={W} height={H} style={{ display: 'block', minWidth: W }}>
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = pad.t + innerH - f * innerH
          const v = f * maxVal
          return (
            <g key={f}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(127,127,127,0.12)" />
              <text x={pad.l - 6} y={y + 4} fontSize="10" fill="var(--text-dim)" textAnchor="end">{v.toFixed(1)}</text>
            </g>
          )
        })}
        {/* budget line */}
        {(() => {
          const y = pad.t + innerH - (budget / maxVal) * innerH
          if (y < pad.t || y > H - pad.b) return null
          return (
            <g>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
              <text x={W - pad.r - 4} y={y - 4} fontSize="10" fill="#f59e0b" textAnchor="end">预算 {budget.toFixed(1)}kg</text>
            </g>
          )
        })()}
        {/* bars */}
        {data.map((d, i) => {
          const h = (d.co2 / maxVal) * innerH
          const x = pad.l + i * (innerW / data.length) + 2
          const y = pad.t + innerH - h
          const today = new Date().toISOString().slice(0, 10)
          const isToday = d.date === today
          const color = d.co2 > budget ? '#ef4444' : isToday ? '#10b981' : '#3b82f6'
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={h} rx="3" fill={color} opacity={isToday ? 1 : 0.8} />
              {(i === 0 || i === 14 || i === data.length - 1) && (
                <text x={x + barW / 2} y={H - pad.b + 16} fontSize="9" fill="var(--text-dim)" textAnchor="middle">
                  {d.date.slice(5)}
                </text>
              )}
              <title>{`${d.date}: ${d.co2.toFixed(2)} kg CO2e`}</title>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function CategoryDonut({ breakdown, sum }: { breakdown: Record<Category, number>; sum: number }) {
  const R = 70, r = 42
  let acc = 0
  const arcs: Array<{ color: string; d: string; pct: number; label: string }> = []
  for (const key of Object.keys(breakdown) as Category[]) {
    const v = breakdown[key] / Math.max(0.001, sum)
    if (v <= 0) continue
    const a0 = acc * 2 * Math.PI - Math.PI / 2
    const a1 = (acc + v) * 2 * Math.PI - Math.PI / 2
    acc += v
    const x0 = 120 + R * Math.cos(a0), y0 = 120 + R * Math.sin(a0)
    const x1 = 120 + R * Math.cos(a1), y1 = 120 + R * Math.sin(a1)
    const xi0 = 120 + r * Math.cos(a1), yi0 = 120 + r * Math.sin(a1)
    const xi1 = 120 + r * Math.cos(a0), yi1 = 120 + r * Math.sin(a0)
    const large = v > 0.5 ? 1 : 0
    const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`
    arcs.push({ color: CATEGORY_META[key].color, d, pct: v, label: CATEGORY_META[key].label })
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width="240" height="240" viewBox="0 0 240 240">
        {arcs.length === 0 && <text x="120" y="120" fontSize="12" fill="var(--text-dim)" textAnchor="middle">暂无数据</text>}
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} opacity={0.92} />)}
        <text x="120" y="114" fontSize="11" fill="var(--text-dim)" textAnchor="middle">30 天</text>
        <text x="120" y="132" fontSize="18" fontWeight="700" fill="var(--text)" textAnchor="middle">{(sum / 1).toFixed(0)} kg</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(Object.keys(breakdown) as Category[]).map(k => {
          const pct = breakdown[k] / Math.max(0.001, sum) * 100
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: CATEGORY_META[k].color, display: 'inline-block' }} />
              <span style={{ fontSize: 13, flex: 1 }}>{CATEGORY_META[k].label}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', width: 70, textAlign: 'right' }}>
                {breakdown[k].toFixed(1)} kg
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FactBox({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={st.factBox}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  )
}

function OffsetTile({ icon, title, value, unit, sub }: { icon: string; title: string; value: string; unit: string; sub: string }) {
  return (
    <div style={st.offsetTile}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value} <span style={{ fontSize: 13, fontWeight: 500 }}>{unit}</span></div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function ActionItem({ title, impact, tip }: { title: string; impact: number; tip: string }) {
  return (
    <li style={st.actionItem}>
      <div style={st.actionIcon}>
        {impact >= 0.5 ? '🟢' : impact >= 0.1 ? '🟡' : '🔵'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{tip}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 800, color: '#059669' }}>-{impact.toFixed(2)}</div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>吨/年 CO₂e</div>
      </div>
    </li>
  )
}

/* ========== STYLES ========== */
const st: Record<string, React.CSSProperties> = {
  wrap: {
    height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, "Noto Sans SC", sans-serif',
    background: 'radial-gradient(1200px 600px at 10% -10%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(1000px 500px at 90% 0%, rgba(59,130,246,0.08), transparent 60%), var(--panel)',
    color: 'var(--text, #1f2937)',
  },
  header: {
    padding: '14px 22px',
    borderBottom: '1px solid var(--border, rgba(127,127,127,0.15))',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
    background: 'color-mix(in srgb, var(--panel) 90%, rgba(16,185,129,0.04))',
    backdropFilter: 'blur(6px)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 40, height: 40, borderRadius: 12,
    background: 'linear-gradient(135deg,#059669,#0ea5e9)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 10px 24px -10px rgba(5,150,105,0.6)',
  },
  brandTitle: { fontWeight: 800, fontSize: 20 },
  brandSub: { fontSize: 12, color: 'var(--text-dim, #666)' },
  tabs: { display: 'flex', gap: 3, padding: 4, borderRadius: 12, background: 'rgba(127,127,127,0.06)' },
  tab: {
    padding: '8px 14px', borderRadius: 10, border: 0, cursor: 'pointer',
    background: 'transparent', color: 'var(--text-dim, #555)',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  },
  tabActive: { background: 'var(--panel, #fff)', color: 'var(--text, #1f2937)', boxShadow: '0 3px 10px -6px rgba(0,0,0,0.15)' },

  kpiBar: {
    display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12, padding: '16px 22px 4px',
  },
  kpiCard: {
    padding: 14, borderRadius: 14,
    background: 'var(--panel, rgba(255,255,255,0.7))',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
    backdropFilter: 'blur(4px)',
  },
  body: { flex: 1, overflow: 'auto', padding: '18px 26px 26px' },

  h3: { fontSize: 17, fontWeight: 700, margin: '0 0 12px 0' },

  catChip: { padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 },

  factorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 10,
  },
  factorCard: {
    padding: 10, borderRadius: 12,
    background: 'var(--panel, rgba(255,255,255,0.75))',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  factorInput: {
    flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 12,
    border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'rgba(127,127,127,0.04)', outline: 'none', fontFamily: 'inherit',
    color: 'var(--text)',
  },
  btnTiny: {
    padding: '6px 12px', borderRadius: 8, border: 0, cursor: 'pointer', fontSize: 12, fontWeight: 700,
    background: 'linear-gradient(135deg,#059669,#0ea5e9)', color: '#fff', fontFamily: 'inherit',
  },
  btnGhostSmall: {
    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'var(--panel-2, rgba(127,127,127,0.06))', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
    color: 'var(--text)',
  },
  smallInput: {
    padding: '6px 10px', borderRadius: 8, fontSize: 13,
    border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'rgba(127,127,127,0.04)', color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
  },
  inlineLabel: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' },
  inlineInput: {
    width: 52, padding: '3px 6px', fontSize: 12, borderRadius: 6,
    border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'rgba(127,127,127,0.04)', fontFamily: 'inherit', color: 'var(--text)',
  },
  iconBtn: { background: 'transparent', border: 0, cursor: 'pointer', fontSize: 12, padding: 2, color: 'var(--text-dim)' },

  emptyBoxSmall: { padding: 22, textAlign: 'center', color: 'var(--text-dim)', borderRadius: 12, background: 'rgba(127,127,127,0.05)', fontSize: 13 },

  ringWrap: { position: 'relative', width: 180, height: 180, margin: '0 auto 16px' },
  ringCenter: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },

  recordList: { display: 'flex', flexDirection: 'column', gap: 6 },
  recordRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10,
    background: 'var(--panel, rgba(255,255,255,0.75))',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
  },

  chartCard: {
    padding: 14, borderRadius: 16,
    background: 'var(--panel, rgba(255,255,255,0.75))',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
  },

  weatherCard: {
    padding: 24, borderRadius: 20, color: '#fff',
    background: 'linear-gradient(135deg,#0ea5e9 0%,#059669 100%)',
    boxShadow: '0 20px 40px -20px rgba(14,165,233,0.6)',
  },
  weatherTemp: { display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 18, color: '#fff' },
  weatherGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  weatherCell: {
    padding: 10, borderRadius: 12,
    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)',
    display: 'flex', flexDirection: 'column', gap: 4,
  },

  factBox: {
    padding: 12, borderRadius: 12, display: 'flex', gap: 12,
    background: 'var(--panel, rgba(255,255,255,0.75))',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
  },

  offsetCard: {
    padding: 20, borderRadius: 18,
    background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.08))',
    border: '1px solid var(--border, rgba(127,127,127,0.15))',
  },
  offsetTile: {
    padding: 14, borderRadius: 14, textAlign: 'left',
    background: 'var(--panel, rgba(255,255,255,0.75))',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
  },

  actionList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  actionItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
    background: 'var(--panel, rgba(255,255,255,0.75))',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
  },
  actionIcon: { fontSize: 18 },

  footer: {
    padding: '10px 22px', fontSize: 11, color: 'var(--text-dim, #888)',
    display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
    borderTop: '1px solid var(--border, rgba(127,127,127,0.15))',
  },
}
