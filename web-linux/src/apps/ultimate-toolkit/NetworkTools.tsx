import { useState, useCallback } from 'react'
import { useStore } from '../../store'
import {
  Globe, Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer,
  MapPin, DollarSign, Flag, RefreshCw, Copy, Ruler, Zap,
} from './Shared'
import {
  type ToolProps,
  ToolHeader, SearchBar, StatCard, InfoCard,
  inputStyle, labelStyle, selectStyle, primaryBtnStyle, ghostBtnStyle, swapBtnStyle,
} from './Shared'

const weatherIconMap: Record<string, React.ReactNode> = {
  clear: <Sun size={48} style={{ color: '#fbbf24' }} />,
  clouds: <Cloud size={48} style={{ color: '#94a3b8' }} />,
  rain: <CloudRain size={48} style={{ color: '#60a5fa' }} />,
  snow: <CloudSnow size={48} style={{ color: '#e0f2fe' }} />,
  thunderstorm: <CloudRain size={48} style={{ color: '#a855f7' }} />,
  fog: <Cloud size={48} style={{ color: '#9ca3af' }} />,
  drizzle: <CloudRain size={48} style={{ color: '#93c5fd' }} />,
}

function getWeatherIcon(code: number): React.ReactNode {
  if (code === 0) return weatherIconMap.clear
  if (code === 1 || code === 2 || code === 3) return weatherIconMap.clouds
  if (code === 45 || code === 48) return weatherIconMap.fog
  if (code >= 51 && code <= 67) return weatherIconMap.rain
  if (code >= 71 && code <= 77) return weatherIconMap.snow
  if (code >= 80 && code <= 82) return weatherIconMap.rain
  if (code >= 85 && code <= 86) return weatherIconMap.snow
  if (code >= 95) return weatherIconMap.thunderstorm
  return weatherIconMap.clouds
}

function getWeatherDesc(code: number): string {
  const map: Record<number, string> = {
    0: '晴', 1: '大部晴朗', 2: '多云', 3: '阴天',
    45: '雾', 48: '冻雾', 51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
    61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
    80: '阵雨', 81: '中阵雨', 82: '强阵雨', 85: '阵雪', 86: '强阵雪',
    95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴伴冰雹',
  }
  return map[code] || '未知'
}

const iconBtnStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8,
  background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
  color: 'var(--text-secondary)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
}

type UnitCategory = 'length' | 'weight' | 'temperature' | 'currency'

const lengthUnits: Record<string, { label: string; factor: number }> = {
  mm: { label: '毫米 (mm)', factor: 0.001 },
  cm: { label: '厘米 (cm)', factor: 0.01 },
  m: { label: '米 (m)', factor: 1 },
  km: { label: '千米 (km)', factor: 1000 },
  inch: { label: '英寸 (in)', factor: 0.0254 },
  foot: { label: '英尺 (ft)', factor: 0.3048 },
  yard: { label: '码 (yd)', factor: 0.9144 },
  mile: { label: '英里 (mi)', factor: 1609.344 },
}

const weightUnits: Record<string, { label: string; factor: number }> = {
  mg: { label: '毫克 (mg)', factor: 0.000001 },
  g: { label: '克 (g)', factor: 0.001 },
  kg: { label: '千克 (kg)', factor: 1 },
  ton: { label: '公吨 (t)', factor: 1000 },
  oz: { label: '盎司 (oz)', factor: 0.0283495 },
  lb: { label: '磅 (lb)', factor: 0.453592 },
  jin: { label: '斤', factor: 0.5 },
}

const tempUnits: Record<string, { label: string }> = {
  celsius: { label: '摄氏度 (°C)' },
  fahrenheit: { label: '华氏度 (°F)' },
  kelvin: { label: '开尔文 (K)' },
}

const currencyList = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD', 'AUD', 'CAD', 'CHF', 'SGD', 'KRW', 'INR', 'NZD', 'SEK', 'NOK', 'DKK', 'RUB', 'ZAR', 'MXN', 'BRL']

export function UnitConverterTool({ onAddHistory, onCopy }: ToolProps) {
  const [category, setCategory] = useState<UnitCategory>('length')
  const [input, setInput] = useState('1')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('cm')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<Record<string, number> | null>(null)

  const loadRates = useCallback(async () => {
    if (category !== 'currency') return
    setLoading(true)
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD')
      const data = await res.json()
      if (data.rates) {
        setRates({ USD: 1, ...data.rates })
      }
    } catch {
      setRates(null)
    } finally {
      setLoading(false)
    }
  }, [category])

  const convert = useCallback(() => {
    const num = parseFloat(input)
    if (isNaN(num)) { setResult('请输入有效的数值'); return }

    if (category === 'length') {
      const meters = num * lengthUnits[fromUnit].factor
      const converted = meters / lengthUnits[toUnit].factor
      setResult(`${converted.toFixed(6).replace(/\.?0+$/, '')} ${lengthUnits[toUnit].label.split(' ')[0]}`)
      onAddHistory('unit', `${num} ${fromUnit} → ${toUnit}`, `${converted.toFixed(6)}`)
    } else if (category === 'weight') {
      const kg = num * weightUnits[fromUnit].factor
      const converted = kg / weightUnits[toUnit].factor
      setResult(`${converted.toFixed(6).replace(/\.?0+$/, '')} ${weightUnits[toUnit].label.split(' ')[0]}`)
      onAddHistory('unit', `${num} ${fromUnit} → ${toUnit}`, `${converted.toFixed(6)}`)
    } else if (category === 'temperature') {
      let celsius = num
      if (fromUnit === 'fahrenheit') celsius = (num - 32) * 5 / 9
      else if (fromUnit === 'kelvin') celsius = num - 273.15

      let converted = celsius
      if (toUnit === 'fahrenheit') converted = celsius * 9 / 5 + 32
      else if (toUnit === 'kelvin') converted = celsius + 273.15

      setResult(`${converted.toFixed(2)} ${tempUnits[toUnit].label.split(' ')[0]}`)
      onAddHistory('unit', `${num} ${fromUnit} → ${toUnit}`, `${converted.toFixed(2)}`)
    } else if (category === 'currency') {
      if (!rates) { setResult('请先加载汇率'); return }
      const fromRate = rates[fromUnit]
      const toRate = rates[toUnit]
      if (!fromRate || !toRate) { setResult('货币数据不可用'); return }
      const converted = (num / fromRate) * toRate
      setResult(`${converted.toFixed(4)} ${toUnit}`)
      onAddHistory('unit', `${num} ${fromUnit} → ${toUnit}`, `${converted.toFixed(4)}`)
    }
  }, [input, fromUnit, toUnit, category, rates, onAddHistory])

  const switchUnits = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
    setResult('')
  }

  const categories: { key: UnitCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'length', label: '长度', icon: <Ruler size={16} /> },
    { key: 'weight', label: '重量', icon: <Zap size={16} /> },
    { key: 'temperature', label: '温度', icon: <Thermometer size={16} /> },
    { key: 'currency', label: '货币', icon: <DollarSign size={16} /> },
  ]

  const units = category === 'length' ? lengthUnits
    : category === 'weight' ? weightUnits
    : category === 'temperature' ? tempUnits
    : null

  const availableFrom = category === 'currency' ? currencyList : Object.keys(units!)
  const availableTo = category === 'currency' ? currencyList : Object.keys(units!)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <ToolHeader icon={<Ruler size={20} style={{ color: '#60a5fa' }} />} title="单位转换器" subtitle="长度、重量、温度、货币汇率转换" />

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {categories.map(({ key, label, icon }) => (
          <button key={key} onClick={() => { setCategory(key); setFromUnit(key === 'currency' ? 'USD' : Object.keys(key === 'length' ? lengthUnits : key === 'weight' ? weightUnits : tempUnits)[0]); setToUnit(key === 'currency' ? 'CNY' : Object.keys(key === 'length' ? lengthUnits : key === 'weight' ? weightUnits : tempUnits)[1] || Object.keys(key === 'length' ? lengthUnits : key === 'weight' ? weightUnits : tempUnits)[0]); setResult('') }} style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            background: category === key ? 'var(--accent-bg)' : 'var(--glass-bg)',
            border: category === key ? '1px solid var(--accent)' : '1px solid var(--window-border)',
            color: category === key ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13, fontWeight: category === key ? 600 : 400,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {category === 'currency' && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <button onClick={loadRates} disabled={loading} style={{
            ...ghostBtnStyle, flex: 1,
            opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            <RefreshCw size={14} className={loading ? 'ut-spin' : ''} />
            {loading ? '加载汇率中...' : rates ? '刷新汇率' : '加载实时汇率'}
          </button>
          {rates && <span style={{ fontSize: 11, color: 'var(--text-secondary)', alignSelf: 'center' }}>数据来源: frankfurter.app</span>}
        </div>
      )}

      <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>从</label>
            <input type="number" value={input} onChange={(e) => setInput(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} style={selectStyle}>
              {availableFrom.map((u) => (
                <option key={u} value={u}>{category === 'currency' ? u : (units as Record<string, any>)[u].label}</option>
              ))}
            </select>
          </div>

          <button onClick={switchUnits} style={{
            padding: '10px', borderRadius: 10,
            background: 'var(--accent-bg)', border: '1px solid var(--accent)',
            color: 'var(--accent)', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 2,
          }} title="交换">
            ⇄
          </button>

          <div>
            <label style={labelStyle}>到</label>
            <div style={{ ...inputStyle, marginBottom: 8, background: 'var(--window-bg)', color: 'var(--accent)', fontWeight: 600, textAlign: 'right', fontFamily: 'monospace' }}>
              {result || '—'}
            </div>
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} style={selectStyle}>
              {availableTo.map((u) => (
                <option key={u} value={u}>{category === 'currency' ? u : (units as Record<string, any>)[u].label}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={convert} style={{ ...primaryBtnStyle, width: '100%', marginTop: 12 }}>
          <Zap size={16} /> 转换
        </button>

        {result && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button onClick={() => onCopy(result, '转换结果已复制')} style={iconBtnStyle}>
              <Copy size={14} /> 复制结果
            </button>
          </div>
        )}
      </div>

      {category === 'currency' && !rates && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: 12, color: 'var(--text-secondary)' }}>
          货币转换需要先加载实时汇率数据。点击上方"加载实时汇率"按钮获取当前汇率。
        </div>
      )}
    </div>
  )
}

export function WeatherTool({ onAddHistory, onCopy: _onCopy }: ToolProps) {
  const addNotification = useStore((s) => s.addNotification)
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState<any>(null)

  const search = useCallback(async (target?: string) => {
    const q = (target ?? city).trim()
    if (!q) {
      addNotification({ title: '请输入城市名', message: '', type: 'warning' })
      return
    }
    setLoading(true)
    setWeather(null)
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=zh`
      )
      const geoData = await geoRes.json()
      if (!geoData.results?.length) throw new Error('未找到该城市')
      const { latitude, longitude, name, country } = geoData.results[0]

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      )
      const data = await weatherRes.json()
      setWeather({ ...data, cityName: name, country })
      onAddHistory('weather', `${name}, ${country}`, `${data.current.temperature_2m}°C`)
    } catch (err: any) {
      addNotification({ title: '查询失败', message: err.message || '请检查城市名', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [city, onAddHistory, addNotification])

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <ToolHeader icon={<Cloud size={20} style={{ color: '#60a5fa' }} />} title="天气查询" subtitle="Open-Meteo API · 全球城市天气预报" />
      <SearchBar value={city} onChange={setCity} onSearch={() => search()} placeholder="输入城市名（如: Beijing, New York）" loading={loading} />

      {weather && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.12), rgba(167, 139, 250, 0.12))',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            borderRadius: 16, padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <MapPin size={16} /> {weather.cityName}, {weather.country}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              {getWeatherIcon(weather.current.weather_code)}
              <div>
                <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
                  {Math.round(weather.current.temperature_2m)}°
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {getWeatherDesc(weather.current.weather_code)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <StatCard icon={<Thermometer size={16} />} label="体感温度" value={`${Math.round(weather.current.apparent_temperature)}°C`} />
            <StatCard icon={<Droplets size={16} />} label="湿度" value={`${weather.current.relative_humidity_2m}%`} />
            <StatCard icon={<Wind size={16} />} label="风速" value={`${weather.current.wind_speed_10m} km/h`} />
          </div>

          {weather.daily && (
            <div style={{
              background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>今日预报</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>最高</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#f87171' }}>
                    {Math.round(weather.daily.temperature_2m_max?.[0])}°
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>最低</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#60a5fa' }}>
                    {Math.round(weather.daily.temperature_2m_min?.[0])}°
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>天气</div>
                  <div>{getWeatherIcon(weather.daily.weather_code?.[0])}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const currencies = [
  { code: 'USD', name: '美元' }, { code: 'CNY', name: '人民币' },
  { code: 'EUR', name: '欧元' }, { code: 'GBP', name: '英镑' },
  { code: 'JPY', name: '日元' }, { code: 'KRW', name: '韩元' },
  { code: 'HKD', name: '港币' }, { code: 'AUD', name: '澳元' },
  { code: 'CAD', name: '加元' }, { code: 'CHF', name: '瑞郎' },
  { code: 'SGD', name: '新加坡元' }, { code: 'INR', name: '卢比' },
  { code: 'BRL', name: '雷亚尔' }, { code: 'ZAR', name: '兰特' },
]

export function CurrencyTool({ onAddHistory, onCopy }: ToolProps) {
  const addNotification = useStore((s) => s.addNotification)
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('CNY')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const convert = useCallback(async () => {
    const num = Number(amount)
    if (!num || isNaN(num)) {
      addNotification({ title: '请输入有效金额', message: '', type: 'warning' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const rate = data.rates[to]
      const converted = num * rate
      setResult({ rate, converted, date: data.date })
      onAddHistory('currency', `${num} ${from} → ${to}`, `${converted.toFixed(4)} ${to}`)
    } catch (err: any) {
      addNotification({ title: '转换失败', message: err.message || '汇率服务不可用', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [amount, from, to, onAddHistory, addNotification])

  const swap = () => { const t = from; setFrom(to); setTo(t); setResult(null) }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <ToolHeader icon={<DollarSign size={20} style={{ color: '#34d399' }} />} title="汇率转换" subtitle="Frankfurter API · 实时汇率" />

      <div style={{
        background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(96, 165, 250, 0.08))',
        border: '1px solid var(--window-border)', borderRadius: 16, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div>
          <label style={labelStyle}>金额</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>从</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} style={selectStyle}>
              {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </select>
          </div>
          <button onClick={swap} style={swapBtnStyle} title="交换">⇄</button>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>到</label>
            <select value={to} onChange={(e) => setTo(e.target.value)} style={selectStyle}>
              {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </select>
          </div>
        </div>

        <button onClick={convert} disabled={loading} style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}>
          {loading ? <RefreshCw size={16} className="ut-spin" /> : <DollarSign size={16} />}
          {loading ? '转换中...' : '查询汇率'}
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: 16, background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
          borderRadius: 16, padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {amount} {from} =
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>
            {result.converted.toLocaleString('zh-CN', { maximumFractionDigits: 4 })} {to}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            1 {from} = {result.rate.toFixed(4)} {to} · 更新于 {result.date}
          </div>
          <button onClick={() => onCopy(result.converted.toFixed(4), '已复制转换结果')} style={ghostBtnStyle}>
            <Copy size={14} /> 复制结果
          </button>
        </div>
      )}
    </div>
  )
}

export function IPTool({ onAddHistory, onCopy }: ToolProps) {
  const addNotification = useStore((s) => s.addNotification)
  const [ip, setIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const lookup = useCallback(async (target?: string) => {
    const q = (target ?? ip).trim()
    setLoading(true)
    setData(null)
    try {
      const url = q ? `https://ipapi.co/${encodeURIComponent(q)}/json/` : 'https://ipapi.co/json/'
      const res = await fetch(url)
      const result = await res.json()
      if (result.error) throw new Error(result.reason || '查询失败')
      setData(result)
      onAddHistory('ip', q || '本机IP', result.ip)
    } catch (err: any) {
      addNotification({ title: '查询失败', message: err.message || '请检查IP格式', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [ip, onAddHistory, addNotification])

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <ToolHeader icon={<Globe size={20} style={{ color: '#a78bfa' }} />} title="IP地址查询" subtitle="ipapi.co API · IP地理位置定位" />
      <SearchBar value={ip} onChange={setIp} onSearch={() => lookup()} placeholder="留空查询本机IP，或输入IP地址" loading={loading} />

      {data && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(96, 165, 250, 0.1))',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            borderRadius: 16, padding: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>您的IP地址</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>{data.ip}</div>
            </div>
            <button onClick={() => onCopy(data.ip, 'IP已复制')} style={ghostBtnStyle}>
              <Copy size={14} /> 复制
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <InfoCard label="国家" value={`${data.country_name || '-'} ${data.country_emoji || ''}`} />
            <InfoCard label="地区" value={data.region || '-'} />
            <InfoCard label="城市" value={data.city || '-'} />
            <InfoCard label="邮编" value={data.postal || '-'} />
            <InfoCard label="经纬度" value={data.latitude ? `${data.latitude.toFixed(4)}, ${data.longitude?.toFixed(4)}` : '-'} />
            <InfoCard label="时区" value={data.timezone || '-'} />
            <InfoCard label="运营商" value={data.org || '-'} />
            <InfoCard label="ASN" value={data.asn || '-'} />
          </div>
        </div>
      )}
    </div>
  )
}

export function CountryTool({ onAddHistory, onCopy: _onCopy }: ToolProps) {
  const addNotification = useStore((s) => s.addNotification)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [country, setCountry] = useState<any>(null)

  const search = useCallback(async (target?: string) => {
    const q = (target ?? name).trim()
    if (!q) {
      addNotification({ title: '请输入国家名', message: '', type: 'warning' })
      return
    }
    setLoading(true)
    setCountry(null)
    try {
      const res = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(q)}` +
        `?fields=name,flags,capital,population,area,region,subregion,currencies,languages,timezones,borders,latlng`
      )
      if (!res.ok) throw new Error('未找到该国家')
      const data = await res.json()
      const result = data[0]
      setCountry(result)
      onAddHistory('country', q, result.name?.common || q)
    } catch (err: any) {
      addNotification({ title: '查询失败', message: err.message || '请输入正确的国家名', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [name, onAddHistory, addNotification])

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <ToolHeader icon={<Flag size={20} style={{ color: '#f472b6' }} />} title="国家信息查询" subtitle="REST Countries API · 世界各国信息" />
      <SearchBar value={name} onChange={setName} onSearch={() => search()} placeholder="输入国家名（中英文均可）" loading={loading} />

      {country && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.1), rgba(251, 191, 36, 0.1))',
            border: '1px solid var(--window-border)', borderRadius: 16, padding: 20,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            {country.flags?.svg && (
              <img src={country.flags.svg} alt="flag" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--window-border)' }} />
            )}
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{country.name?.common}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{country.name?.official}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <InfoCard label="首都" value={(country.capital && country.capital[0]) || '-'} />
            <InfoCard label="区域" value={country.region || '-'} />
            <InfoCard label="子区域" value={country.subregion || '-'} />
            <InfoCard label="人口" value={country.population?.toLocaleString() || '-'} />
            <InfoCard label="面积" value={country.area ? `${country.area.toLocaleString()} km²` : '-'} />
            <InfoCard label="时区" value={country.timezones?.[0] || '-'} />
          </div>

          {country.currencies && (
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>货币</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(country.currencies).map(([code, info]: [string, any]) => (
                  <span key={code} style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: 'var(--accent-bg)', color: 'var(--accent)',
                    fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {code} {info.symbol || ''} {info.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {country.languages && (
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>语言</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.values(country.languages).map((lang: unknown, i: number) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 12 }}>{String(lang)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}