import { useState, useEffect, useCallback, memo } from 'react'
import {
  Wind, Droplets, TrendingUp, TrendingDown, Clock, Calendar,
  Quote, Coffee, Brain, Sparkles, RefreshCw, Globe, Zap,
  Heart, Star, Target, Award, BookOpen, Music, Camera,
  Briefcase, DollarSign, MessageCircle
} from 'lucide-react'

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  windSpeed: number
  icon: string
  city: string
}

interface CryptoData {
  name: string
  symbol: string
  price: number
  change24h: number
  icon: string
}

interface QuoteData {
  content: string
  author: string
}

interface ExchangeRate {
  from: string
  to: string
  rate: number
}

interface NewsItem {
  title: string
  source: string
  url: string
}

interface GitHubRepo {
  name: string
  description: string
  stars: number
  language: string
}

const defaultWeather: WeatherData = {
  temp: 23,
  condition: '晴',
  humidity: 45,
  windSpeed: 12,
  icon: '☀️',
  city: '北京'
}

const defaultCryptos: CryptoData[] = [
  { name: 'Bitcoin', symbol: 'BTC', price: 67234.56, change24h: 2.34, icon: '₿' },
  { name: 'Ethereum', symbol: 'ETH', price: 3456.78, change24h: -1.23, icon: 'Ξ' },
  { name: 'Solana', symbol: 'SOL', price: 178.45, change24h: 5.67, icon: '◎' },
]

const motivationalQuotes: QuoteData[] = [
  { content: '生活不是等待暴风雨过去，而是学会在雨中跳舞。', author: '维维安·格林' },
  { content: '成功不是终点，失败也并非末日，最重要的是继续前进的勇气。', author: '丘吉尔' },
  { content: '你的时间有限，不要浪费在重复别人的生活上。', author: '史蒂夫·乔布斯' },
  { content: '千里之行，始于足下。', author: '老子' },
  { content: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子' },
  { content: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { content: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '古训' },
  { content: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { content: '天将降大任于斯人也，必先苦其心志，劳其筋骨。', author: '孟子' },
  { content: '志当存高远，慕先贤，绝情欲，弃凝滞。', author: '诸葛亮' },
  { content: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { content: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { content: 'Code is like humor. When you have to explain it, it\'s bad.', author: 'Cory House' },
  { content: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
]

const funFacts = [
  '蜂蜜永远不会变质，考古学家发现过3000年前的蜂蜜仍然可以食用。',
  '章鱼有三颗心脏，蓝色的血液，而且能够编辑自己的RNA。',
  '地球上的树木数量比银河系的恒星数量还多。',
  '人类DNA中有大约8%来自古代病毒。',
  '香蕉其实是浆果，而草莓不是。',
  '一只猫有230块骨头，比人类还多。',
  '世界上最长的地名有85个字母。',
  '你的胃壁每3-4天就会完全更新一次。',
  '闪电的温度比太阳表面还热。',
  '企鹅有膝盖，只是被羽毛盖住了。',
]

const weeklyFocus = [
  { day: '周一', focus: '规划与启动', icon: '🚀', color: '#ff6b6b' },
  { day: '周二', focus: '深度工作', icon: '💪', color: '#feca57' },
  { day: '周三', focus: '中期回顾', icon: '🔍', color: '#48dbfb' },
  { day: '周四', focus: '冲刺完成', icon: '⚡', color: '#ff9ff3' },
  { day: '周五', focus: '总结学习', icon: '📚', color: '#1dd1a1' },
  { day: '周六', focus: '休闲充电', icon: '🎮', color: '#5f27cd' },
  { day: '周日', focus: '反思准备', icon: '🧘', color: '#00d2d3' },
]

function getDayOfWeek(): number {
  return new Date().getDay()
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 17) return '下午好'
  if (hour < 19) return '傍晚好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const IntelligentDashboard = memo(function IntelligentDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData>(defaultWeather)
  const [cryptos, setCryptos] = useState<CryptoData[]>(defaultCryptos)
  const [quote, setQuote] = useState<QuoteData>(getRandomItem(motivationalQuotes))
  const [funFact, setFunFact] = useState(getRandomItem(funFacts))
  const [activeTab, setActiveTab] = useState<'overview' | 'focus' | 'inspiration'>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [cryptoLoading, setCryptoLoading] = useState(false)
  
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([])
  const [githubLoading, setGithubLoading] = useState(false)

  const todayIndex = (getDayOfWeek() + 6) % 7

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true)
    try {
      const cities = ['北京', '上海', '深圳', '广州', '杭州']
      const city = cities[Math.floor(Math.random() * cities.length)]
      const lat = 39.9 + Math.random() * 10
      const lon = 116.4 + Math.random() * 10
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=auto`
      )
      
      if (response.ok) {
        const data = await response.json()
        const current = data.current
        const weatherCode = current.weather_code
        const isDay = current.is_day === 1
        
        let icon = '☀️'
        let condition = '晴'
        
        if (weatherCode === 0) {
          icon = isDay ? '☀️' : '🌙'
          condition = '晴朗'
        } else if (weatherCode <= 3) {
          icon = isDay ? '⛅' : '☁️'
          condition = '多云'
        } else if (weatherCode <= 48) {
          icon = '🌫️'
          condition = '有雾'
        } else if (weatherCode <= 67) {
          icon = '🌧️'
          condition = '小雨'
        } else if (weatherCode <= 77) {
          icon = '❄️'
          condition = '雪'
        } else if (weatherCode <= 82) {
          icon = '🌧️'
          condition = '阵雨'
        } else if (weatherCode <= 99) {
          icon = '⛈️'
          condition = '雷暴'
        }
        
        setWeather({
          temp: Math.round(current.temperature_2m),
          condition,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          icon,
          city
        })
      }
    } catch (e) {
      // 使用模拟数据
      setWeather(prev => ({
        ...prev,
        temp: Math.round(20 + Math.random() * 15),
        humidity: Math.round(40 + Math.random() * 40),
        windSpeed: Math.round(5 + Math.random() * 20),
      }))
    }
    setWeatherLoading(false)
  }, [])

  const fetchCryptos = useCallback(async () => {
    setCryptoLoading(true)
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true'
      )
      
      if (response.ok) {
        const data = await response.json()
        setCryptos([
          { name: 'Bitcoin', symbol: 'BTC', price: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change, icon: '₿' },
          { name: 'Ethereum', symbol: 'ETH', price: data.ethereum.usd, change24h: data.ethereum.usd_24h_change, icon: 'Ξ' },
          { name: 'Solana', symbol: 'SOL', price: data.solana.usd, change24h: data.solana.usd_24h_change, icon: '◎' },
        ])
      }
    } catch (e) {
      // 使用模拟数据，但添加一些波动
      setCryptos(prev => prev.map(c => ({
        ...c,
        price: c.price * (1 + (Math.random() - 0.5) * 0.02),
        change24h: c.change24h + (Math.random() - 0.5) * 2
      })))
    }
    setCryptoLoading(false)
  }, [])

  const fetchExchangeRates = useCallback(async () => {
    setRatesLoading(true)
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD')
      if (response.ok) {
        const data = await response.json()
        const targets = ['CNY', 'EUR', 'JPY', 'GBP']
        setExchangeRates(targets.map(to => ({
          from: 'USD',
          to,
          rate: data.rates[to]
        })))
      }
    } catch (e) {
      setExchangeRates([
        { from: 'USD', to: 'CNY', rate: 7.24 },
        { from: 'USD', to: 'EUR', rate: 0.92 },
        { from: 'USD', to: 'JPY', rate: 149.8 },
        { from: 'USD', to: 'GBP', rate: 0.79 },
      ])
    }
    setRatesLoading(false)
  }, [])

  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    try {
      const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      if (response.ok) {
        const ids = await response.json()
        const topIds = ids.slice(0, 5)
        const stories = await Promise.all(topIds.map(async (id: number) => {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          return res.json()
        }))
        setNewsItems(stories.map(s => ({
          title: s.title,
          source: 'Hacker News',
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`
        })))
      }
    } catch (e) {
      setNewsItems([
        { title: 'WebLinuxOS: 浏览器中的完整Linux桌面体验', source: 'GitHub', url: '#' },
        { title: 'React 19 新特性解析', source: 'Tech News', url: '#' },
        { title: 'TypeScript 6.0 发布', source: 'Dev.to', url: '#' },
      ])
    }
    setNewsLoading(false)
  }, [])

  const fetchGitHubTrending = useCallback(async () => {
    setGithubLoading(true)
    try {
      const response = await fetch('https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc')
      if (response.ok) {
        const data = await response.json()
        setGithubRepos(data.items.slice(0, 4).map((item: { name: string; description?: string; stargazers_count: number; language?: string }) => ({
          name: item.name,
          description: item.description || '',
          stars: item.stargazers_count,
          language: item.language || 'Unknown'
        })))
      }
    } catch (e) {
      setGithubRepos([
        { name: 'WebLinuxOS', description: '浏览器中的完整Linux桌面体验', stars: 1200, language: 'TypeScript' },
        { name: 'React', description: '用于构建用户界面的JavaScript库', stars: 220000, language: 'JavaScript' },
        { name: 'TypeScript', description: 'JavaScript的超集', stars: 95000, language: 'TypeScript' },
      ])
    }
    setGithubLoading(false)
  }, [])

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([fetchWeather(), fetchCryptos(), fetchExchangeRates(), fetchNews(), fetchGitHubTrending()])
    setQuote(getRandomItem(motivationalQuotes))
    setFunFact(getRandomItem(funFacts))
    setTimeout(() => setIsRefreshing(false), 500)
  }, [fetchWeather, fetchCryptos, fetchExchangeRates, fetchNews, fetchGitHubTrending])

  useEffect(() => {
    fetchWeather()
    fetchCryptos()
    fetchExchangeRates()
    fetchNews()
    fetchGitHubTrending()
  }, [fetchWeather, fetchCryptos, fetchExchangeRates, fetchNews, fetchGitHubTrending])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })
  }

  const todayFocus = weeklyFocus[todayIndex]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, rgba(124, 108, 240, 0.05) 0%, transparent 30%)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              智能仪表盘
            </h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {getGreeting()}！今天是 {formatDate(currentTime)}
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={isRefreshing}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--window-border)',
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.background = 'var(--accent-bg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--window-border)'
            e.currentTarget.style.background = 'var(--glass-bg)'
          }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} style={{
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }} />
          刷新
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: 4,
        padding: '12px 24px 0',
        borderBottom: '1px solid var(--window-border)',
      }}>
        {[
          { id: 'overview', label: '概览', icon: <Globe size={14} /> },
          { id: 'focus', label: '今日焦点', icon: <Target size={14} /> },
          { id: 'inspiration', label: '灵感', icon: <Brain size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === tab.id ? 'var(--accent-bg)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <div className="dashboard-card" style={{
              padding: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.15) 0%, rgba(0, 206, 201, 0.1) 100%)',
              border: '1px solid var(--window-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>当前时间</p>
                  <h1 style={{ fontSize: 42, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -1 }}>
                    {formatTime(currentTime)}
                  </h1>
                </div>
                <Clock size={28} style={{ color: 'var(--accent)', opacity: 0.8 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
                <Calendar size={14} />
                {formatDate(currentTime)}
              </div>
            </div>

            <div className="dashboard-card" style={{
              padding: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(254, 202, 87, 0.1) 100%)',
              border: '1px solid var(--window-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {weather.city} 天气
                    {weatherLoading && <span style={{ marginLeft: 6, fontSize: 10 }}>刷新中...</span>}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 42, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {weather.temp}°
                    </span>
                    <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{weather.condition}</span>
                  </div>
                </div>
                <span style={{ fontSize: 40 }}>{weather.icon}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Droplets size={12} /> 湿度 {weather.humidity}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wind size={12} /> 风速 {weather.windSpeed} km/h
                </span>
              </div>
            </div>

            <div className="dashboard-card" style={{
              padding: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(29, 209, 161, 0.1) 0%, rgba(0, 210, 211, 0.1) 100%)',
              border: '1px solid var(--window-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  加密货币行情
                  {cryptoLoading && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, color: 'var(--text-secondary)' }}>刷新中...</span>}
                </h3>
                <TrendingUp size={18} style={{ color: '#1dd1a1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cryptos.map((crypto) => (
                  <div key={crypto.symbol} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{crypto.icon}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{crypto.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{crypto.symbol}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        ${crypto.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </p>
                      <p style={{
                        fontSize: 11,
                        color: crypto.change24h >= 0 ? '#1dd1a1' : '#ff6b6b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 2,
                      }}>
                        {crypto.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(crypto.change24h).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-card" style={{
              padding: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(72, 219, 251, 0.1) 0%, rgba(0, 210, 211, 0.1) 100%)',
              border: '1px solid var(--window-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  实时汇率
                  {ratesLoading && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, color: 'var(--text-secondary)' }}>刷新中...</span>}
                </h3>
                <DollarSign size={18} style={{ color: '#48dbfb' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {exchangeRates.map((rate) => (
                  <div key={rate.to} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{rate.from}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>→</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{rate.to}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#48dbfb' }}>
                      {rate.rate.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-card" style={{
              padding: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(155, 138, 240, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%)',
              border: '1px solid var(--window-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Quote size={18} style={{ color: '#f093fb' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>每日名言</h3>
              </div>
              <blockquote style={{
                fontSize: 14,
                color: 'var(--text-primary)',
                lineHeight: 1.8,
                fontStyle: 'italic',
                marginBottom: 12,
                paddingLeft: 12,
                borderLeft: '3px solid var(--accent)',
              }}>
                "{quote.content}"
              </blockquote>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
                — {quote.author}
              </p>
            </div>

            <div className="dashboard-card" style={{
              padding: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(254, 202, 87, 0.1) 0%, rgba(255, 159, 243, 0.1) 100%)',
              border: '1px solid var(--window-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Zap size={18} style={{ color: '#feca57' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>冷知识</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.8 }}>
                💡 {funFact}
              </p>
            </div>

            <div className="dashboard-card" style={{
              padding: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(254, 202, 87, 0.1) 100%)',
              border: '1px solid var(--window-border)',
              gridColumn: 'span 2',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  技术新闻
                  {newsLoading && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, color: 'var(--text-secondary)' }}>刷新中...</span>}
                </h3>
                <MessageCircle size={18} style={{ color: '#ff6b6b' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {newsItems.map((news, index) => (
                  <a
                    key={index}
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.03)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {news.title}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{news.source}</p>
                    </div>
                    <span style={{ fontSize: 16, color: 'var(--accent)' }}>→</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="dashboard-card" style={{
              padding: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(29, 209, 161, 0.1) 0%, rgba(72, 219, 251, 0.1) 100%)',
              border: '1px solid var(--window-border)',
              gridColumn: 'span 2',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  GitHub 热门项目
                  {githubLoading && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, color: 'var(--text-secondary)' }}>刷新中...</span>}
                </h3>
                <Briefcase size={18} style={{ color: '#1dd1a1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {githubRepos.map((repo, index) => (
                  <div key={index} style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--window-border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>📦</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{repo.name}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                      {repo.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: '#ffc107' }}>⭐ {repo.stars.toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{repo.language}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'focus' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{
              padding: 32,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${todayFocus.color}22 0%, ${todayFocus.color}11 100%)`,
              border: `1px solid ${todayFocus.color}44`,
              textAlign: 'center',
              marginBottom: 32,
            }}>
              <span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>{todayFocus.icon}</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                {todayFocus.day} · {todayFocus.focus}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                今天是本周的第 {todayIndex + 1} 天，专注于「{todayFocus.focus}」
              </p>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              本周节奏
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {weeklyFocus.map((day, index) => (
                <div
                  key={day.day}
                  style={{
                    padding: '16px 8px',
                    borderRadius: 12,
                    background: index === todayIndex 
                      ? `${day.color}22` 
                      : 'var(--glass-bg)',
                    border: `1px solid ${index === todayIndex ? day.color : 'var(--window-border)'}`,
                    textAlign: 'center',
                    transition: 'all 0.3s',
                    transform: index === todayIndex ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>{day.icon}</span>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {day.day}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {day.focus}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                今日建议
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: <Coffee size={18} />, title: '番茄工作法', desc: '专注25分钟，休息5分钟，每4个周期休息15-30分钟', color: '#ff6b6b' },
                  { icon: <Brain size={18} />, title: '深度工作时段', desc: '上午9-11点是大脑最清醒的时段，安排最重要的任务', color: '#48dbfb' },
                  { icon: <Heart size={18} />, title: '记得休息', desc: '每小时起身活动一下，远眺放松眼睛', color: '#ff9ff3' },
                  { icon: <Star size={18} />, title: '每日三省', desc: '睡前花10分钟回顾今天的收获和待改进之处', color: '#feca57' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 16,
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--window-border)',
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${item.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: item.color,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inspiration' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {[
                { icon: <BookOpen size={24} />, title: '学习资源', items: ['MDN Web Docs', 'GitHub Trending', 'Hacker News', 'Dev.to'], color: '#7c6cf0' },
                { icon: <Music size={24} />, title: '专注音乐', items: ['Lo-Fi Hip Hop', '古典音乐', '自然白噪音', '环境音乐'], color: '#00d2d3' },
                { icon: <Camera size={24} />, title: '灵感来源', items: ['Dribbble', 'Behance', 'Awwwards', 'Pinterest'], color: '#ff6b6b' },
                { icon: <Award size={24} />, title: '效率工具', items: ['Pomodoro Timer', 'Todo List', 'Mind Map', 'Kanban Board'], color: '#1dd1a1' },
              ].map((section, si) => (
                <div key={si} style={{
                  padding: 20,
                  borderRadius: 16,
                  background: `${section.color}11`,
                  border: `1px solid ${section.color}33`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${section.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: section.color,
                    }}>
                      {section.icon}
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {section.title}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {section.items.map((item, ii) => (
                      <span key={ii} style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        background: 'var(--glass-bg)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--window-border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = section.color
                        e.currentTarget.style.borderColor = section.color
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)'
                        e.currentTarget.style.borderColor = 'var(--window-border)'
                      }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 32, padding: 24, borderRadius: 16, background: 'var(--glass-bg)', border: '1px solid var(--window-border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                💡 今日励志名言
              </h3>
              <blockquote style={{
                fontSize: 18,
                color: 'var(--text-primary)',
                lineHeight: 2,
                fontStyle: 'italic',
                marginBottom: 16,
                padding: '20px 24px',
                background: 'linear-gradient(135deg, var(--accent-bg) 0%, transparent 100%)',
                borderRadius: 12,
                borderLeft: '4px solid var(--accent)',
              }}>
                "{quote.content}"
              </blockquote>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right' }}>
                — {quote.author}
              </p>
              <button
                onClick={() => setQuote(getRandomItem(motivationalQuotes))}
                style={{
                  marginTop: 16,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--window-border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--window-border)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                换一条
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default IntelligentDashboard
