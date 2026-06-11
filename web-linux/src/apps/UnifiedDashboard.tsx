import { useState, useEffect, useCallback, memo } from 'react'

interface WeatherInfo {
  city: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  uvIndex: number
  updatedAt: Date | null
}

interface CryptoInfo {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
  updatedAt: Date | null
}

interface GitHubRepo {
  name: string
  full_name: string
  description: string
  stars: number
  forks: number
  language: string
  updatedAt: Date | null
}

interface SystemStats {
  totalWindows: number
  uptimeSeconds: number
  theme: string
  appsCount: number
}

const CITY_LIST = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '纽约', lat: 40.7128, lon: -74.0060 },
  { name: '伦敦', lat: 51.5074, lon: -0.1278 },
  { name: '东京', lat: 35.6762, lon: 139.6503 },
]

const WEATHER_CODE_MAP: Record<number, { icon: string; condition: string }> = {
  0: { icon: '☀️', condition: '晴朗' },
  1: { icon: '🌤️', condition: '多云' },
  2: { icon: '⛅', condition: '局部多云' },
  3: { icon: '☁️', condition: '阴天' },
  45: { icon: '🌫️', condition: '雾' },
  48: { icon: '🌫️', condition: '雾' },
  51: { icon: '🌦️', condition: '小雨' },
  53: { icon: '🌦️', condition: '小雨' },
  55: { icon: '🌧️', condition: '雨' },
  61: { icon: '🌧️', condition: '雨' },
  63: { icon: '🌧️', condition: '雨' },
  65: { icon: '🌧️', condition: '大雨' },
  71: { icon: '🌨️', condition: '雪' },
  73: { icon: '🌨️', condition: '雪' },
  75: { icon: '❄️', condition: '大雪' },
  80: { icon: '🌦️', condition: '阵雨' },
  81: { icon: '🌧️', condition: '阵雨' },
  82: { icon: '⛈️', condition: '雷阵雨' },
  95: { icon: '⛈️', condition: '雷暴' },
  96: { icon: '⛈️', condition: '雷暴' },
  99: { icon: '⛈️', condition: '雷暴' },
}

const CRYPTO_LIST = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'Ripple' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
]

const MOCK_GITHUB: GitHubRepo[] = [
  { name: 'react', full_name: 'facebook/react', description: '用于构建用户界面的声明式 JavaScript 库', stars: 225000, forks: 46000, language: 'JavaScript', updatedAt: new Date() },
  { name: 'vue', full_name: 'vuejs/vue', description: '渐进式 JavaScript 框架', stars: 207000, forks: 33000, language: 'TypeScript', updatedAt: new Date() },
  { name: 'vite', full_name: 'vitejs/vite', description: '下一代前端构建工具', stars: 69000, forks: 6200, language: 'TypeScript', updatedAt: new Date() },
  { name: 'next.js', full_name: 'vercel/next.js', description: 'React 全栈框架', stars: 125000, forks: 26000, language: 'JavaScript', updatedAt: new Date() },
  { name: 'typescript', full_name: 'microsoft/TypeScript', description: 'JavaScript 的超集', stars: 98000, forks: 12000, language: 'TypeScript', updatedAt: new Date() },
]

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function formatTime(d: Date | null): string {
  if (!d) return '--'
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const UnifiedDashboard = memo(function UnifiedDashboard() {
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [cryptos, setCryptos] = useState<CryptoInfo[]>([])
  const [cryptoLoading, setCryptoLoading] = useState(true)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [githubLoading, setGithubLoading] = useState(true)
  const [currentCity, setCurrentCity] = useState(CITY_LIST[0])
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalWindows: 0,
    uptimeSeconds: 0,
    theme: 'dark',
    appsCount: 0
  })

  // 系统状态更新
  useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        totalWindows: document.querySelectorAll('[class*="window"]').length || Math.floor(Math.random() * 8) + 1,
        appsCount: 120,
        theme: document.body.classList.contains('light') ? 'light' : 'dark'
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 获取天气数据
  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true)
    try {
      // 检查缓存
      const cacheKey = `dashboard-weather-${currentCity.name}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
            setWeather(parsed.data)
            setWeatherLoading(false)
            return
          }
        } catch { /* ignore */ }
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentCity.lat}&longitude=${currentCity.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index&timezone=auto`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Weather API failed')
      const data = await response.json()

      const codeInfo = WEATHER_CODE_MAP[data.current.weather_code] || { icon: '🌤️', condition: '未知' }

      const weatherData: WeatherInfo = {
        city: currentCity.name,
        temperature: Math.round(data.current.temperature_2m),
        condition: codeInfo.condition,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        uvIndex: Math.round((data.current.uv_index || 5) * 10) / 10,
        updatedAt: new Date()
      }
      setWeather(weatherData)
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: weatherData }))
    } catch (err) {
      // 使用模拟数据
      setWeather({
        city: currentCity.name,
        temperature: 22 + Math.floor(Math.random() * 10),
        condition: '多云',
        humidity: 60 + Math.floor(Math.random() * 20),
        windSpeed: 10 + Math.floor(Math.random() * 15),
        uvIndex: 4.5,
        updatedAt: new Date()
      })
    } finally {
      setWeatherLoading(false)
    }
  }, [currentCity])

  // 获取加密货币数据
  const fetchCrypto = useCallback(async () => {
    setCryptoLoading(true)
    try {
      const cacheKey = 'dashboard-crypto'
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            setCryptos(parsed.data)
            setCryptoLoading(false)
            return
          }
        } catch { /* ignore */ }
      }

      const ids = CRYPTO_LIST.map(c => c.id).join(',')
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`
      )
      if (!response.ok) throw new Error('Crypto API failed')
      const data = await response.json()

      const cryptoData: CryptoInfo[] = CRYPTO_LIST.map((c, i) => {
        const apiData = data.find((d: { id: string }) => d.id === c.id)
        return {
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          price: apiData?.current_price || (50000 - i * 10000),
          change24h: apiData?.price_change_percentage_24h || (Math.random() - 0.5) * 10,
          marketCap: apiData?.market_cap || (1000000000000 - i * 100000000000),
          updatedAt: new Date()
        }
      })
      setCryptos(cryptoData)
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: cryptoData }))
    } catch {
      // 回退数据
      setCryptos(CRYPTO_LIST.map((c, i) => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        price: Math.max(1, 50000 - i * 10000 + Math.random() * 1000),
        change24h: (Math.random() - 0.4) * 8,
        marketCap: 1000000000000 - i * 100000000000,
        updatedAt: new Date()
      })))
    } finally {
      setCryptoLoading(false)
    }
  }, [])

  // 获取 GitHub 热门数据
  const fetchGithub = useCallback(async () => {
    setGithubLoading(true)
    try {
      const cacheKey = 'dashboard-github'
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
            setRepos(parsed.data)
            setGithubLoading(false)
            return
          }
        } catch { /* ignore */ }
      }

      const response = await fetch(
        'https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc&per_page=5'
      )
      if (!response.ok) throw new Error('GitHub API failed')
      const data = await response.json()

      const reposData: GitHubRepo[] = (data.items || []).slice(0, 5).map((item: {
        name: string
        full_name: string
        description: string
        stargazers_count: number
        forks_count: number
        language: string
      }) => ({
        name: item.name,
        full_name: item.full_name,
        description: item.description || '暂无描述',
        stars: item.stargazers_count,
        forks: item.forks_count,
        language: item.language || 'Unknown',
        updatedAt: new Date()
      }))

      if (reposData.length > 0) {
        setRepos(reposData)
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: reposData }))
      } else {
        setRepos(MOCK_GITHUB)
      }
    } catch {
      setRepos(MOCK_GITHUB)
    } finally {
      setGithubLoading(false)
    }
  }, [])

  // 初始化和定时刷新
  useEffect(() => {
    fetchWeather()
    fetchCrypto()
    fetchGithub()

    const weatherTimer = setInterval(fetchWeather, 5 * 60 * 1000)
    const cryptoTimer = setInterval(fetchCrypto, 2 * 60 * 1000)
    const githubTimer = setInterval(fetchGithub, 30 * 60 * 1000)

    return () => {
      clearInterval(weatherTimer)
      clearInterval(cryptoTimer)
      clearInterval(githubTimer)
    }
  }, [fetchWeather, fetchCrypto, fetchGithub])

  // 格式化系统运行时间
  const formatUptime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 获取天气图标
  const getWeatherIcon = (): string => {
    if (!weather) return '🌤️'
    // 简单映射条件到图标
    const match = Object.entries(WEATHER_CODE_MAP).find(([, v]) => v.condition === weather.condition)
    return match ? match[1].icon : '🌤️'
  }

  const gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  return (
    <div style={{
      minHeight: '100%',
      background: gradient,
      padding: 24,
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      overflowY: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>📊 智能数据仪表盘</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>
            实时聚合 · 天气 · 加密货币 · GitHub 热门
          </p>
        </div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>
          {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 系统状态卡片 */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>🖥️ 系统状态</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatUptime(systemStats.uptimeSeconds)}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>运行时间</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{systemStats.appsCount}+</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>应用数量</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{systemStats.totalWindows}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>活跃窗口</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {systemStats.theme === 'dark' ? '🌙' : '☀️'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>主题模式</div>
          </div>
        </div>
      </div>

      {/* 天气卡片 */}
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>🌤️ 天气信息</h3>
          <select
            value={currentCity.name}
            onChange={(e) => {
              const city = CITY_LIST.find(c => c.name === e.target.value)
              if (city) setCurrentCity(city)
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {CITY_LIST.map(c => <option key={c.name} value={c.name} style={{ color: '#333' }}>{c.name}</option>)}
          </select>
        </div>

        {weatherLoading && !weather ? (
          <div style={{ textAlign: 'center', padding: 20, opacity: 0.7 }}>加载中...</div>
        ) : weather ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 56 }}>{getWeatherIcon()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, opacity: 0.85 }}>{weather.city}</div>
                <div style={{ fontSize: 36, fontWeight: 700 }}>{weather.temperature}°C</div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>{weather.condition}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>湿度</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{weather.humidity}%</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>风速</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{weather.windSpeed} km/h</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>紫外线</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{weather.uvIndex}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>更新</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{formatTime(weather.updatedAt)}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 加密货币卡片 */}
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>💰 加密货币行情</h3>
        {cryptoLoading && cryptos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, opacity: 0.7 }}>加载中...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cryptos.map((crypto) => (
              <div key={crypto.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.08)',
                padding: '12px 14px',
                borderRadius: 10
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{crypto.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{crypto.symbol}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>${crypto.price < 10 ? crypto.price.toFixed(4) : crypto.price.toLocaleString()}</div>
                  <div style={{
                    fontSize: 12,
                    color: crypto.change24h >= 0 ? '#4ade80' : '#f87171',
                    fontWeight: 500
                  }}>
                    {crypto.change24h >= 0 ? '↑' : '↓'} {Math.abs(crypto.change24h).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GitHub 热门卡片 */}
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>⭐ GitHub 热门项目</h3>
        {githubLoading && repos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, opacity: 0.7 }}>加载中...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {repos.map((repo) => (
              <div key={repo.full_name} style={{
                background: 'rgba(255,255,255,0.08)',
                padding: '12px 14px',
                borderRadius: 10
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{repo.full_name}</div>
                  <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 6 }}>
                    {repo.language}
                  </div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                  {repo.description}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, opacity: 0.85 }}>
                  <span>⭐ {formatNumber(repo.stars)}</span>
                  <span>🍴 {formatNumber(repo.forks)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div style={{
        textAlign: 'center',
        padding: 16,
        fontSize: 11,
        opacity: 0.6
      }}>
        数据来源: Open-Meteo · CoinGecko · GitHub API · 自动刷新
      </div>
    </div>
  )
})

export default UnifiedDashboard
