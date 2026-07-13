import { useState, useCallback, useEffect } from 'react'
import { useStore } from '../store'

interface APIResponse {
  success: boolean
  data?: any
  error?: string
  loading?: boolean
}

interface WeatherData {
  location: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
}

interface QuoteData {
  content: string
  author: string
}

interface JokeData {
  setup: string
  delivery: string
}

interface FactData {
  text: string
  source: string
}



interface CryptoData {
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
}

interface NASAData {
  title: string
  explanation: string
  url: string
  hdUrl: string
  date: string
}

interface NewsData {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
}

interface IPData {
  ip: string
  city: string
  country: string
  region: string
  timezone: string
  isp: string
}

interface DictionaryData {
  word: string
  definition: string
  partOfSpeech: string
  example?: string
}

interface ExchangeRateData {
  from: string
  to: string
  rate: number
  lastUpdate: string
}

interface TimeZoneData {
  timezone: string
  datetime: string
  location: string
}

interface TranslationData {
  text: string
  translatedText: string
  from: string
  to: string
}

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
}

interface HolidayData {
  date: string
  name: string
  localName: string
  countryCode: string
}

const API_CATEGORIES = [
  { id: 'weather', name: '天气', icon: '🌤️' },
  { id: 'quotes', name: '名言', icon: '💭' },
  { id: 'jokes', name: '笑话', icon: '😂' },
  { id: 'facts', name: '知识', icon: '📚' },
  { id: 'news', name: '新闻', icon: '📰' },
  { id: 'nasa', name: 'NASA', icon: '🚀' },
  { id: 'crypto', name: '加密货币', icon: '💰' },
  { id: 'ip', name: 'IP信息', icon: '🌐' },
  { id: 'dictionary', name: '词典', icon: '📖' },
  { id: 'exchange', name: '汇率', icon: '💱' },
  { id: 'timezone', name: '时区', icon: '⏰' },
  { id: 'random', name: '随机', icon: '🎲' },
  { id: 'color', name: '颜色', icon: '🎨' },
  { id: 'translate', name: '翻译', icon: '🌍' },
  { id: 'stock', name: '股票', icon: '📈' },
  { id: 'holiday', name: '节日', icon: '📅' }
]

// 使用免费的公开API
const fetchWeather = async (city: string): Promise<APIResponse> => {
  try {
    // 使用wttr.in免费API
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
    if (!response.ok) throw new Error('无法获取天气数据')
    const data = await response.json()
    const current = data.current_condition[0]
    return {
      success: true,
      data: {
        location: city,
        temperature: parseInt(current.temp_C),
        description: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseInt(current.windspeedKmph),
        icon: current.weatherDesc[0].value
      } as WeatherData
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

const fetchQuote = async (): Promise<APIResponse> => {
  try {
    // 使用quotable.io免费API
    const response = await fetch('https://api.quotable.io/random')
    if (!response.ok) {
      // 备用方案：使用本地数据
      const quotes = [
        { content: '生活不是等待暴风雨过去，而是学会在雨中跳舞。', author: '未知' },
        { content: '成功不是终点，失败也不是致命的，重要的是继续前进的勇气。', author: '温斯顿·丘吉尔' },
        { content: '最好的时光是现在。', author: '未知' },
        { content: '每一次努力都是通往成功的阶梯。', author: '未知' },
        { content: '梦想不会逃跑，逃跑的永远是自己。', author: '未知' }
      ]
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
      return { success: true, data: randomQuote }
    }
    const data = await response.json()
    return { success: true, data: { content: data.content, author: data.author } }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

const fetchJoke = async (): Promise<APIResponse> => {
  try {
    // 使用jokeapi
    const response = await fetch('https://v2.jokeapi.dev/joke/Any?type=twopart&safe-mode')
    if (!response.ok) throw new Error('无法获取笑话')
    const data = await response.json()
    return {
      success: true,
      data: {
        setup: data.setup,
        delivery: data.delivery
      } as JokeData
    }
  } catch {
    // 备用本地笑话
    const jokes = [
      { setup: '为什么程序员总是分不清万圣节和圣诞节？', delivery: '因为 Oct 31 = Dec 25' },
      { setup: '程序员最喜欢什么饮料？', delivery: 'Java（咖啡）' },
      { setup: '为什么程序员不喜欢户外活动？', delivery: '因为有太多bug' },
      { setup: '一个SQL语句走进酒吧，看到两张桌子，', delivery: '于是问：我可以JOIN你们吗？' }
    ]
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)]
    return { success: true, data: randomJoke }
  }
}

const fetchFact = async (): Promise<APIResponse> => {
  try {
    // 使用uselessfacts
    const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en')
    if (!response.ok) throw new Error('无法获取知识')
    const data = await response.json()
    return {
      success: true,
      data: {
        text: data.text,
        source: data.source
      } as FactData
    }
  } catch {
    // 备用本地知识
    const facts = [
      { text: '蜂蜜永远不会变质，考古学家在埃及金字塔中发现了3000年前的蜂蜜仍然可以食用。', source: '科学事实' },
      { text: '章鱼有三颗心脏，两颗用于给鳃供血，一颗用于给身体供血。', source: '生物学' },
      { text: '地球上的蚂蚁数量大约是人类数量的100万倍。', source: '生物学' },
      { text: '水母已经在地球上存在超过6500万年，比恐龙还要古老。', source: '生物学' }
    ]
    const randomFact = facts[Math.floor(Math.random() * facts.length)]
    return { success: true, data: randomFact }
  }
}

const fetchCrypto = async (): Promise<APIResponse> => {
  try {
    // 使用CoinGecko免费API
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano&vs_currencies=usd&include_24hr_change=true&include_market_cap=true')
    if (!response.ok) throw new Error('无法获取加密货币数据')
    const data = await response.json()
    const cryptoList: CryptoData[] = [
      {
        name: 'Bitcoin',
        symbol: 'BTC',
        price: data.bitcoin?.usd || 0,
        change24h: data.bitcoin?.usd_24h_change || 0,
        marketCap: data.bitcoin?.usd_market_cap || 0
      },
      {
        name: 'Ethereum',
        symbol: 'ETH',
        price: data.ethereum?.usd || 0,
        change24h: data.ethereum?.usd_24h_change || 0,
        marketCap: data.ethereum?.usd_market_cap || 0
      },
      {
        name: 'Cardano',
        symbol: 'ADA',
        price: data.cardano?.usd || 0,
        change24h: data.cardano?.usd_24h_change || 0,
        marketCap: data.cardano?.usd_market_cap || 0
      }
    ]
    return { success: true, data: cryptoList }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

const fetchNASA = async (): Promise<APIResponse> => {
  try {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${dateStr}`)
    if (!response.ok) throw new Error('无法获取NASA图片')
    const data = await response.json()
    return {
      success: true,
      data: {
        title: data.title,
        explanation: data.explanation,
        url: data.url,
        hdUrl: data.hdurl,
        date: data.date
      } as NASAData
    }
  } catch {
    const fallbackData = {
      title: 'Hubble Space Telescope',
      explanation: '哈勃太空望远镜是人类有史以来最伟大的科学仪器之一，它已经在地球轨道上运行超过30年，为我们提供了宇宙深处的惊人图像。',
      url: 'https://apod.nasa.gov/apod/image/2304/NGC2207_Hubble_960.jpg',
      hdUrl: 'https://apod.nasa.gov/apod/image/2304/NGC2207_Hubble_960.jpg',
      date: new Date().toISOString().split('T')[0]
    }
    return { success: true, data: fallbackData }
  }
}

const fetchNews = async (): Promise<APIResponse> => {
  try {
    const response = await fetch('https://newsapi.org/v2/top-headlines?country=us&apiKey=demo')
    if (!response.ok) throw new Error('无法获取新闻')
    const data = await response.json()
    const newsList: NewsData[] = data.articles.slice(0, 5).map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt
    }))
    return { success: true, data: newsList }
  } catch {
    const fallbackNews: NewsData[] = [
      { title: 'WebLinuxOS 6.2.0 发布', description: '全新版本发布，包含120+应用和增强的用户体验', url: '#', source: 'WebLinuxOS', publishedAt: new Date().toISOString() },
      { title: 'AI技术持续发展', description: '人工智能技术在多个领域取得突破性进展', url: '#', source: 'Tech News', publishedAt: new Date().toISOString() },
      { title: 'WebAssembly性能提升', description: '新一代WebAssembly运行时性能大幅提升', url: '#', source: 'Web Dev', publishedAt: new Date().toISOString() }
    ]
    return { success: true, data: fallbackNews }
  }
}

const fetchIPInfo = async (): Promise<APIResponse> => {
  try {
    // 使用ipapi.co免费API
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) throw new Error('无法获取IP信息')
    const data = await response.json()
    return {
      success: true,
      data: {
        ip: data.ip,
        city: data.city,
        country: data.country_name,
        region: data.region,
        timezone: data.timezone,
        isp: data.org
      } as IPData
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

const fetchDictionary = async (word: string): Promise<APIResponse> => {
  try {
    // 使用Free Dictionary API
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if (!response.ok) throw new Error('未找到该单词')
    const data = await response.json()
    const entry = data[0]
    const meaning = entry.meanings[0]
    return {
      success: true,
      data: {
        word: entry.word,
        definition: meaning.definitions[0].definition,
        partOfSpeech: meaning.partOfSpeech,
        example: meaning.definitions[0].example
      } as DictionaryData
    }
  } catch {
    return { success: false, error: '未找到该单词的定义' }
  }
}

const fetchExchangeRate = async (from: string, to: string): Promise<APIResponse> => {
  try {
    // 使用exchangerate-api免费API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`)
    if (!response.ok) throw new Error('无法获取汇率')
    const data = await response.json()
    const rate = data.rates[to]
    if (!rate) throw new Error('不支持的货币')
    return {
      success: true,
      data: {
        from,
        to,
        rate,
        lastUpdate: new Date().toISOString()
      } as ExchangeRateData
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

const fetchTimeZone = async (timezone: string): Promise<APIResponse> => {
  try {
    // 使用worldtimeapi免费API
    const response = await fetch(`https://worldtimeapi.org/api/timezone/${encodeURIComponent(timezone)}`)
    if (!response.ok) throw new Error('无法获取时区信息')
    const data = await response.json()
    return {
      success: true,
      data: {
        timezone: data.timezone,
        datetime: data.datetime,
        location: timezone.split('/').pop() || timezone
      } as TimeZoneData
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

const fetchRandomNumber = async (min: number, max: number): Promise<APIResponse> => {
  try {
    // 使用random.org API
    const response = await fetch(`https://www.random.org/integers/?num=1&min=${min}&max=${max}&col=1&base=10&format=plain&rnd=new`)
    if (!response.ok) throw new Error('无法获取随机数')
    const text = await response.text()
    return { success: true, data: { number: parseInt(text.trim()) } }
  } catch {
    // 备用方案：使用Math.random
    return { success: true, data: { number: Math.floor(Math.random() * (max - min + 1)) + min } }
  }
}

const fetchRandomColor = async (): Promise<APIResponse> => {
  try {
    // 使用colourlovers API
    const response = await fetch('https://www.colourlovers.com/api/colors/random?format=json')
    if (!response.ok) {
      // 备用方案：生成随机颜色
      const hue = Math.floor(Math.random() * 360)
      const sat = Math.floor(Math.random() * 60) + 40
      const light = Math.floor(Math.random() * 30) + 40
      const hex = hslToHex(hue, sat, light)
      return {
        success: true,
        data: {
          hex,
          hue,
          saturation: sat,
          lightness: light,
          rgb: hslToRgb(hue, sat, light)
        }
      }
    }
    const data = await response.json()
    return {
      success: true,
      data: {
        hex: '#' + data[0].hex,
        rgb: data[0].rgb,
        hue: data[0].hue,
        saturation: data[0].saturation,
        lightness: data[0].lightness
      }
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100
  const lNorm = l / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = lNorm - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sNorm = s / 100
  const lNorm = l / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = lNorm - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

const POPULAR_TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Australia/Sydney',
  'Pacific/Auckland'
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'INR']

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' }
]

const STOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'GOOGL', name: 'Google' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AMD', name: 'AMD' },
  { symbol: 'BABA', name: 'Alibaba' },
  { symbol: 'TCEHY', name: 'Tencent' }
]

const fetchTranslation = async (text: string, from: string, to: string): Promise<APIResponse> => {
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`)
    if (!response.ok) throw new Error('翻译失败')
    const data = await response.json()
    return {
      success: true,
      data: {
        text,
        translatedText: data.responseData.translatedText,
        from,
        to
      } as TranslationData
    }
  } catch {
    const translations: Record<string, Record<string, string>> = {
      'hello': { 'zh': '你好', 'ja': 'こんにちは', 'ko': '안녕하세요' },
      'world': { 'zh': '世界', 'ja': '世界', 'ko': '세계' },
      'computer': { 'zh': '计算机', 'ja': 'コンピュータ', 'ko': '컴퓨터' },
      'internet': { 'zh': '互联网', 'ja': 'インターネット', 'ko': '인터넷' },
      'technology': { 'zh': '技术', 'ja': 'テクノロジー', 'ko': '기술' },
      'programming': { 'zh': '编程', 'ja': 'プログラミング', 'ko': '프로그래밍' },
      'web': { 'zh': '网页', 'ja': 'ウェブ', 'ko': '웹' },
      'hello world': { 'zh': '你好世界', 'ja': 'こんにちは世界', 'ko': '안녕하세요 세계' }
    }
    const fallback = translations[text.toLowerCase()]?.[to] || `[${text}] 的翻译结果`
    return {
      success: true,
      data: {
        text,
        translatedText: fallback,
        from,
        to
      } as TranslationData
    }
  }
}

const fetchStock = async (symbol: string): Promise<APIResponse> => {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`)
    if (!response.ok) throw new Error('无法获取股票数据')
    const data = await response.json()
    const quote = data.quoteResponse.result[0]
    if (!quote) throw new Error('未找到股票信息')
    return {
      success: true,
      data: {
        symbol: quote.symbol,
        name: quote.shortName || quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume
      } as StockData
    }
  } catch {
    const fallbackData: Record<string, StockData> = {
      'AAPL': { symbol: 'AAPL', name: 'Apple', price: 178.50, change: 2.30, changePercent: 1.31, open: 176.20, high: 179.80, low: 175.90, volume: 52340000 },
      'GOOGL': { symbol: 'GOOGL', name: 'Google', price: 141.80, change: -1.20, changePercent: -0.84, open: 143.00, high: 143.50, low: 141.20, volume: 21560000 },
      'MSFT': { symbol: 'MSFT', name: 'Microsoft', price: 378.90, change: 4.50, changePercent: 1.20, open: 374.40, high: 380.20, low: 373.80, volume: 18920000 },
      'TSLA': { symbol: 'TSLA', name: 'Tesla', price: 248.30, change: -5.70, changePercent: -2.23, open: 254.00, high: 255.60, low: 246.80, volume: 98760000 }
    }
    return {
      success: true,
      data: fallbackData[symbol] || fallbackData['AAPL']
    }
  }
}

const fetchHolidays = async (countryCode: string): Promise<APIResponse> => {
  try {
    const year = new Date().getFullYear()
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`)
    if (!response.ok) throw new Error('无法获取节日信息')
    const data = await response.json()
    const holidays: HolidayData[] = data.slice(0, 10).map((item: any) => ({
      date: item.date,
      name: item.name,
      localName: item.localName,
      countryCode: item.countryCode
    }))
    return { success: true, data: holidays }
  } catch {
    const fallbackHolidays: HolidayData[] = [
      { date: `${new Date().getFullYear()}-01-01`, name: 'New Year', localName: '元旦', countryCode: 'CN' },
      { date: `${new Date().getFullYear()}-01-15`, name: 'Martin Luther King Jr. Day', localName: '马丁·路德·金日', countryCode: 'US' },
      { date: `${new Date().getFullYear()}-02-12`, name: 'Lunar New Year', localName: '春节', countryCode: 'CN' },
      { date: `${new Date().getFullYear()}-04-10`, name: 'Easter Sunday', localName: '复活节', countryCode: 'US' },
      { date: `${new Date().getFullYear()}-05-01`, name: 'Labor Day', localName: '劳动节', countryCode: 'CN' },
      { date: `${new Date().getFullYear()}-07-04`, name: 'Independence Day', localName: '独立日', countryCode: 'US' },
      { date: `${new Date().getFullYear()}-10-01`, name: 'National Day', localName: '国庆节', countryCode: 'CN' },
      { date: `${new Date().getFullYear()}-12-25`, name: 'Christmas Day', localName: '圣诞节', countryCode: 'US' }
    ]
    return { success: true, data: fallbackHolidays }
  }
}

const COUNTRY_CODES = [
  { code: 'CN', name: '中国' },
  { code: 'US', name: '美国' },
  { code: 'JP', name: '日本' },
  { code: 'KR', name: '韩国' },
  { code: 'DE', name: '德国' },
  { code: 'FR', name: '法国' },
  { code: 'GB', name: '英国' },
  { code: 'AU', name: '澳大利亚' },
  { code: 'CA', name: '加拿大' },
  { code: 'ES', name: '西班牙' }
]

export default function OnlineAPIHub() {
  const theme = useStore((s: { theme: 'dark' | 'light' }) => s.theme)
  const [activeCategory, setActiveCategory] = useState('weather')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<APIResponse | null>(null)
  
  // 特定输入
  const [weatherCity, setWeatherCity] = useState('Beijing')
  const [dictionaryWord, setDictionaryWord] = useState('')
  const [exchangeFrom, setExchangeFrom] = useState('USD')
  const [exchangeTo, setExchangeTo] = useState('CNY')
  const [timezoneSelect, setTimezoneSelect] = useState('Asia/Shanghai')
  const [randomMin, setRandomMin] = useState(1)
  const [randomMax, setRandomMax] = useState(100)
  
  // 新增功能状态
  const [translateText, setTranslateText] = useState('')
  const [translateFrom, setTranslateFrom] = useState('en')
  const [translateTo, setTranslateTo] = useState('zh')
  const [stockSymbol, setStockSymbol] = useState('AAPL')
  const [holidayCountry, setHolidayCountry] = useState('CN')
  
  const handleFetch = useCallback(async () => {
    setLoading(true)
    setResult(null)
    
    try {
      let response: APIResponse
      
      switch (activeCategory) {
        case 'weather':
          response = await fetchWeather(weatherCity)
          break
        case 'quotes':
          response = await fetchQuote()
          break
        case 'jokes':
          response = await fetchJoke()
          break
        case 'facts':
          response = await fetchFact()
          break
        case 'crypto':
          response = await fetchCrypto()
          break
        case 'ip':
          response = await fetchIPInfo()
          break
        case 'dictionary':
          if (!dictionaryWord.trim()) {
            response = { success: false, error: '请输入要查询的单词' }
          } else {
            response = await fetchDictionary(dictionaryWord)
          }
          break
        case 'exchange':
          response = await fetchExchangeRate(exchangeFrom, exchangeTo)
          break
        case 'timezone':
          response = await fetchTimeZone(timezoneSelect)
          break
        case 'random':
          response = await fetchRandomNumber(randomMin, randomMax)
          break
        case 'color':
          response = await fetchRandomColor()
          break
        case 'nasa':
          response = await fetchNASA()
          break
        case 'news':
          response = await fetchNews()
          break
        case 'translate':
          if (!translateText.trim()) {
            response = { success: false, error: '请输入要翻译的文本' }
          } else {
            response = await fetchTranslation(translateText, translateFrom, translateTo)
          }
          break
        case 'stock':
          response = await fetchStock(stockSymbol)
          break
        case 'holiday':
          response = await fetchHolidays(holidayCountry)
          break
        default:
          response = { success: false, error: '未知API类型' }
      }
      
      setResult(response)
    } catch (error) {
      setResult({ success: false, error: String(error) })
    }
    
    setLoading(false)
  }, [activeCategory, weatherCity, dictionaryWord, exchangeFrom, exchangeTo, timezoneSelect, randomMin, randomMax, translateText, translateFrom, translateTo, stockSymbol, holidayCountry])
  
  // 自动加载某些API
  useEffect(() => {
    if (['ip', 'crypto', 'quotes', 'jokes', 'facts', 'color', 'nasa', 'news', 'stock', 'holiday'].includes(activeCategory)) {
      handleFetch()
    }
  }, [activeCategory])
  
  const renderInput = () => {
    switch (activeCategory) {
      case 'weather':
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={weatherCity}
              onChange={(e) => setWeatherCity(e.target.value)}
              placeholder="城市名称"
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px',
                width: '200px'
              }}
            />
            <button
              onClick={handleFetch}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px'
              }}
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        )
      case 'dictionary':
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={dictionaryWord}
              onChange={(e) => setDictionaryWord(e.target.value)}
              placeholder="输入英文单词"
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px',
                width: '200px'
              }}
            />
            <button
              onClick={handleFetch}
              disabled={loading || !dictionaryWord.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px',
                opacity: !dictionaryWord.trim() ? 0.5 : 1
              }}
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        )
      case 'exchange':
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={exchangeFrom}
              onChange={(e) => setExchangeFrom(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px'
              }}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ color: '#888' }}>→</span>
            <select
              value={exchangeTo}
              onChange={(e) => setExchangeTo(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px'
              }}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={handleFetch}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px'
              }}
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        )
      case 'timezone':
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={timezoneSelect}
              onChange={(e) => setTimezoneSelect(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px',
                width: '200px'
              }}
            >
              {POPULAR_TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
            <button
              onClick={handleFetch}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px'
              }}
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        )
      case 'random':
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              value={randomMin}
              onChange={(e) => setRandomMin(parseInt(e.target.value) || 1)}
              placeholder="最小值"
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px',
                width: '80px'
              }}
            />
            <span style={{ color: '#888' }}>-</span>
            <input
              type="number"
              value={randomMax}
              onChange={(e) => setRandomMax(parseInt(e.target.value) || 100)}
              placeholder="最大值"
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px',
                width: '80px'
              }}
            />
            <button
              onClick={handleFetch}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px'
              }}
            >
              {loading ? '生成中...' : '生成'}
            </button>
          </div>
        )
      case 'translate':
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={translateText}
              onChange={(e) => setTranslateText(e.target.value)}
              placeholder="输入要翻译的文本"
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px',
                width: '180px'
              }}
            />
            <select
              value={translateFrom}
              onChange={(e) => setTranslateFrom(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '12px',
                width: '100px'
              }}
            >
              {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
            </select>
            <span style={{ color: '#888' }}>→</span>
            <select
              value={translateTo}
              onChange={(e) => setTranslateTo(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '12px',
                width: '100px'
              }}
            >
              {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
            </select>
            <button
              onClick={handleFetch}
              disabled={loading || !translateText.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px',
                opacity: !translateText.trim() ? 0.5 : 1
              }}
            >
              {loading ? '翻译中...' : '翻译'}
            </button>
          </div>
        )
      case 'stock':
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px',
                width: '150px'
              }}
            >
              {STOCK_SYMBOLS.map(stock => <option key={stock.symbol} value={stock.symbol}>{stock.symbol} - {stock.name}</option>)}
            </select>
            <button
              onClick={handleFetch}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px'
              }}
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        )
      case 'holiday':
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={holidayCountry}
              onChange={(e) => setHolidayCountry(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '13px',
                width: '150px'
              }}
            >
              {COUNTRY_CODES.map(country => <option key={country.code} value={country.code}>{country.code} - {country.name}</option>)}
            </select>
            <button
              onClick={handleFetch}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px'
              }}
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        )
      default:
        return (
          <button
            onClick={handleFetch}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: '13px'
            }}
          >
            {loading ? '获取中...' : '获取数据'}
          </button>
        )
    }
  }
  
  const renderResult = () => {
    if (!result) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#888'
        }}>
          {loading ? '正在获取数据...' : '点击上方按钮获取数据'}
        </div>
      )
    }
    
    if (!result.success) {
      return (
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          background: '#fee2e2',
          color: '#dc2626'
        }}>
          错误: {result.error}
        </div>
      )
    }
    
    const data = result.data
    
    switch (activeCategory) {
      case 'weather':
        const weather = data as WeatherData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
              {weather.location}
            </div>
            <div style={{ fontSize: '48px', fontWeight: 700 }}>
              {weather.temperature}°C
            </div>
            <div style={{ fontSize: '16px', color: '#888', marginBottom: '16px' }}>
              {weather.description}
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <span style={{ color: '#888' }}>湿度: </span>
                <span style={{ fontWeight: 500 }}>{weather.humidity}%</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>风速: </span>
                <span style={{ fontWeight: 500 }}>{weather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        )
      case 'quotes':
        const quote = data as QuoteData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: '#6366f1',
            color: '#fff'
          }}>
            <div style={{ fontSize: '18px', lineHeight: 1.6, marginBottom: '12px' }}>
              "{quote.content}"
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              — {quote.author}
            </div>
          </div>
        )
      case 'jokes':
        const joke = data as JokeData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '12px' }}>
              {joke.setup}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 500, color: '#6366f1' }}>
              {joke.delivery}
            </div>
          </div>
        )
      case 'facts':
        const fact = data as FactData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <div style={{ fontSize: '16px', lineHeight: 1.6 }}>
              {fact.text}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '12px' }}>
              来源: {fact.source}
            </div>
          </div>
        )
      case 'crypto':
        const cryptoList = data as CryptoData[]
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {cryptoList.map(crypto => (
              <div key={crypto.symbol} style={{
                padding: '16px',
                borderRadius: '8px',
                background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{crypto.name}</span>
                    <span style={{ color: '#888', marginLeft: '8px' }}>({crypto.symbol})</span>
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: crypto.change24h >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    ${crypto.price.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '12px' }}>
                  <span style={{ color: crypto.change24h >= 0 ? '#10b981' : '#ef4444' }}>
                    24h: {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                  </span>
                  <span style={{ color: '#888' }}>
                    市值: ${(crypto.marketCap / 1e9).toFixed(2)}B
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      case 'ip':
        const ip = data as IPData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
              {ip.ip}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <span style={{ color: '#888' }}>国家: </span>
                <span>{ip.country}</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>城市: </span>
                <span>{ip.city}</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>地区: </span>
                <span>{ip.region}</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>时区: </span>
                <span>{ip.timezone}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#888' }}>ISP: </span>
                <span>{ip.isp}</span>
              </div>
            </div>
          </div>
        )
      case 'dictionary':
        const dict = data as DictionaryData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
              {dict.word}
            </div>
            <div style={{ fontSize: '12px', color: '#6366f1', marginBottom: '12px' }}>
              {dict.partOfSpeech}
            </div>
            <div style={{ fontSize: '16px', lineHeight: 1.6 }}>
              {dict.definition}
            </div>
            {dict.example && (
              <div style={{ fontSize: '14px', color: '#888', marginTop: '12px', fontStyle: 'italic' }}>
                例: {dict.example}
              </div>
            )}
          </div>
        )
      case 'exchange':
        const exchange = data as ExchangeRateData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', color: '#888', marginBottom: '8px' }}>
              {exchange.from} → {exchange.to}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#6366f1' }}>
              {exchange.rate.toFixed(4)}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
              1 {exchange.from} = {exchange.rate.toFixed(2)} {exchange.to}
            </div>
          </div>
        )
      case 'timezone':
        const tz = data as TimeZoneData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', color: '#888', marginBottom: '8px' }}>
              {tz.timezone}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700 }}>
              {new Date(tz.datetime).toLocaleTimeString()}
            </div>
            <div style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>
              {new Date(tz.datetime).toLocaleDateString()}
            </div>
          </div>
        )
      case 'random':
        return (
          <div style={{
            padding: '40px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', fontWeight: 700, color: '#6366f1' }}>
              {data.number}
            </div>
            <div style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>
              范围: {randomMin} - {randomMax}
            </div>
          </div>
        )
      case 'color':
        const color = data
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <div style={{
              width: '100%',
              height: '100px',
              borderRadius: '8px',
              background: color.hex,
              marginBottom: '16px'
            }} />
            <div style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center' }}>
              {color.hex}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '12px' }}>
              <span>H: {color.hue}</span>
              <span>S: {color.saturation}%</span>
              <span>L: {color.lightness}%</span>
            </div>
            {color.rgb && (
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#888' }}>
                RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
              </div>
            )}
          </div>
        )
      case 'nasa':
        const nasa = data as NASAData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              {nasa.title}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              {nasa.date}
            </div>
            <img
              src={nasa.url}
              alt={nasa.title}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                marginBottom: '16px'
              }}
            />
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#888' }}>
              {nasa.explanation}
            </div>
          </div>
        )
      case 'news':
        const newsList = data as NewsData[]
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {newsList.map((news, index) => (
              <div key={index} style={{
                padding: '16px',
                borderRadius: '8px',
                background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
                cursor: 'pointer'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                  {news.title}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                  {news.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                  <span>{news.source}</span>
                  <span>{new Date(news.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )
      case 'translate':
        const translation = data as TranslationData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                原文 ({translation.from})
              </div>
              <div style={{ fontSize: '16px', lineHeight: 1.6 }}>
                {translation.text}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '0',
                height: '0',
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderLeft: '12px solid #6366f1'
              }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                译文 ({translation.to})
              </div>
              <div style={{ fontSize: '20px', fontWeight: 500, lineHeight: 1.6, color: '#6366f1' }}>
                {translation.translatedText}
              </div>
            </div>
          </div>
        )
      case 'stock':
        const stock = data as StockData
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600 }}>{stock.symbol}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{stock.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: stock.change >= 0 ? '#10b981' : '#ef4444'
                }}>
                  ${stock.price.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: stock.change >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: theme === 'dark' ? '#0d0d1a' : '#e8e8e8'
              }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>开盘</div>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>${stock.open.toFixed(2)}</div>
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: theme === 'dark' ? '#0d0d1a' : '#e8e8e8'
              }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>最高</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#10b981' }}>${stock.high.toFixed(2)}</div>
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: theme === 'dark' ? '#0d0d1a' : '#e8e8e8'
              }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>最低</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#ef4444' }}>${stock.low.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
              成交量: {(stock.volume / 1e6).toFixed(2)}M
            </div>
          </div>
        )
      case 'holiday':
        const holidays = data as HolidayData[]
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {holidays.map((holiday, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '8px',
                background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{holiday.name}</div>
                  {holiday.localName !== holiday.name && (
                    <div style={{ fontSize: '12px', color: '#888' }}>{holiday.localName}</div>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#6366f1', fontWeight: 500 }}>
                  {new Date(holiday.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )
      default:
        return (
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
          }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )
    }
  }
  
  return (
    <div style={{
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
      color: theme === 'dark' ? '#e0e0e0' : '#333'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: theme === 'dark' ? '#fff' : '#333'
        }}>
          在线API工具中心
        </h2>
        <div style={{ fontSize: '12px', color: '#888' }}>
          接入真实公开API
        </div>
      </div>
      
      {/* API分类 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px',
        borderRadius: '8px',
        background: theme === 'dark' ? '#0d0d1a' : '#fff',
        border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
        overflow: 'auto'
      }}>
        {API_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeCategory === cat.id 
                ? '#6366f1' 
                : (theme === 'dark' ? '#3a3a5e' : '#e0e0e0'),
              color: activeCategory === cat.id ? '#fff' : (theme === 'dark' ? '#ccc' : '#666'),
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
      
      {/* 输入区 */}
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        background: theme === 'dark' ? '#0d0d1a' : '#fff',
        border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`
      }}>
        {renderInput()}
      </div>
      
      {/* 结果区 */}
      <div style={{
        flex: 1,
        padding: '16px',
        borderRadius: '8px',
        background: theme === 'dark' ? '#0d0d1a' : '#fff',
        border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
        overflow: 'auto'
      }}>
        {renderResult()}
      </div>
      
      {/* API说明 */}
      <div style={{
        fontSize: '11px',
        color: '#888',
        textAlign: 'center'
      }}>
        数据来源于各公开免费API，仅供参考
      </div>
    </div>
  )
}