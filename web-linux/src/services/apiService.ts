export interface WeatherData {
  city: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  windDirection: string
  feelsLike: number
  uvIndex: number
  visibility: number
  sunrise: string
  sunset: string
  forecast: DailyForecast[]
}

export interface DailyForecast {
  date: string
  minTemp: number
  maxTemp: number
  description: string
  icon: string
}

export interface NewsArticle {
  id: string
  title: string
  url: string
  source: string
  author: string
  publishedAt: string
  summary: string
}

export interface CryptoPrice {
  symbol: string
  name: string
  priceUsd: number
  priceCny: number
  marketCapUsd: number
  change24h: number
  volume24h: number
}

export interface TranslationResult {
  text: string
  sourceLang: string
  targetLang: string
  detectedLang: string
}

export interface QuoteData {
  content: string
  author: string
  tags: string[]
}

export interface WikipediaSummary {
  title: string
  summary: string
  extract: string
  url: string
  thumbnail?: {
    source: string
    width: number
    height: number
  }
}

export class ApiService {
  private static instance: ApiService
  private baseUrls = {
    weather: 'https://api.open-meteo.com/v1',
    news: 'https://hacker-news.firebaseio.com/v0',
    crypto: 'https://api.coingecko.com/api/v3',
    translate: 'https://libretranslate.de',
    quotes: 'https://api.quotable.io',
    wikipedia: 'https://en.wikipedia.org/api/rest_v1',
    ipapi: 'https://ipapi.co/json'
  }

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  async fetchWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
    try {
      const url = `${this.baseUrls.weather}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,feels_like,uv_index,visibility,sunrise,sunset&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`
      const response = await fetch(url)
      const data = await response.json()

      if (!data.current) return null

      const weatherCodeMap: Record<number, string> = {
        0: '晴', 1: '晴', 2: '多云', 3: '阴',
        45: '雾', 48: '雾凇',
        51: '小雨', 53: '中雨', 55: '大雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        80: '阵雨', 81: '强阵雨', 82: '暴雨',
        95: '雷暴', 96: '雷暴伴冰雹', 99: '雷暴伴大雨'
      }

      const getWeatherDesc = (code: number): string => weatherCodeMap[code] || '未知'

      return {
        city: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`,
        temperature: Math.round(data.current.temperature_2m),
        description: getWeatherDesc(data.current.weather_code),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        windDirection: this.getWindDirection(data.current.wind_direction_10m),
        feelsLike: Math.round(data.current.feels_like),
        uvIndex: data.current.uv_index,
        visibility: data.current.visibility,
        sunrise: data.current.sunrise,
        sunset: data.current.sunset,
        forecast: data.daily.time.map((date: string, i: number) => ({
          date,
          minTemp: Math.round(data.daily.temperature_2m_min[i]),
          maxTemp: Math.round(data.daily.temperature_2m_max[i]),
          description: getWeatherDesc(data.daily.weather_code[i]),
          icon: this.getWeatherIcon(data.daily.weather_code[i])
        }))
      }
    } catch {
      return null
    }
  }

  async fetchNews(): Promise<NewsArticle[]> {
    try {
      const topStoriesUrl = `${this.baseUrls.news}/topstories.json`
      const response = await fetch(topStoriesUrl)
      const storyIds = await response.json() as number[]

      const top10 = storyIds.slice(0, 10)
      const articles = await Promise.all(
        top10.map(async id => {
          const itemUrl = `${this.baseUrls.news}/item/${id}.json`
          const itemResponse = await fetch(itemUrl)
          const item = await itemResponse.json()
          return {
            id: String(id),
            title: item.title || '无标题',
            url: item.url || '#',
            source: item.url ? new URL(item.url).hostname : 'unknown',
            author: item.by || 'anonymous',
            publishedAt: new Date(item.time * 1000).toLocaleString('zh-CN'),
            summary: ''
          }
        })
      )

      return articles
    } catch {
      return []
    }
  }

  async fetchCryptoPrices(symbols: string[]): Promise<CryptoPrice[]> {
    try {
      const ids = symbols.join(',')
      const url = `${this.baseUrls.crypto}/simple/price?ids=${ids}&vs_currencies=usd,cnc&include_market_cap=true&include_24hr_change=true&include_24hr_vol=true`
      const response = await fetch(url)
      const data = await response.json()

      const cryptoNames: Record<string, string> = {
        bitcoin: 'Bitcoin',
        ethereum: 'Ethereum',
        solana: 'Solana',
        dogecoin: 'Dogecoin',
        cardano: 'Cardano',
        ripple: 'XRP',
        litecoin: 'Litecoin',
        polkadot: 'Polkadot',
        chainlink: 'Chainlink',
        usdcoin: 'USD Coin'
      }

      return symbols.map(symbol => {
        const info = data[symbol] || {}
        return {
          symbol: symbol.toUpperCase(),
          name: cryptoNames[symbol] || symbol.toUpperCase(),
          priceUsd: info.usd || 0,
          priceCny: info.cny || 0,
          marketCapUsd: info.usd_market_cap || 0,
          change24h: info.usd_24h_change || 0,
          volume24h: info.usd_24h_vol || 0
        }
      }).filter(c => c.priceUsd > 0)
    } catch {
      return []
    }
  }

  async translate(text: string, targetLang: string = 'zh'): Promise<TranslationResult | null> {
    try {
      const url = `${this.baseUrls.translate}/translate`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: 'auto',
          target: targetLang
        })
      })
      const data = await response.json()

      if (!data.translatedText) return null

      return {
        text: data.translatedText,
        sourceLang: data.detectedLanguage || 'auto',
        targetLang,
        detectedLang: data.detectedLanguage || 'auto'
      }
    } catch {
      return null
    }
  }

  async fetchRandomQuote(): Promise<QuoteData | null> {
    try {
      const url = `${this.baseUrls.quotes}/random`
      const response = await fetch(url)
      const data = await response.json()
      return data
    } catch {
      return null
    }
  }

  async fetchWikipediaSummary(query: string): Promise<WikipediaSummary | null> {
    try {
      const url = `${this.baseUrls.wikipedia}/page/summary/${encodeURIComponent(query)}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.type === 'disambiguation') {
        return null
      }

      return {
        title: data.title || '',
        summary: data.description || '',
        extract: data.extract || '',
        url: data.content_urls?.desktop?.page || '',
        thumbnail: data.thumbnail
      }
    } catch {
      return null
    }
  }

  async fetchIPInfo(): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(this.baseUrls.ipapi)
      return response.json()
    } catch {
      return null
    }
  }

  private getWindDirection(degrees: number): string {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
    const index = Math.round((degrees % 360) / 45) % 8
    return directions[index]
  }

  private getWeatherIcon(code: number): string {
    if (code >= 0 && code <= 3) return '☀️'
    if (code >= 45 && code <= 48) return '🌫️'
    if (code >= 51 && code <= 67) return '🌧️'
    if (code >= 71 && code <= 77) return '❄️'
    if (code >= 80 && code <= 99) return '⛈️'
    return '🌤️'
  }
}

export const apiService = ApiService.getInstance()