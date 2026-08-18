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

export interface IPInfo {
  ip: string
  city?: string
  region?: string
  country?: string
  country_name?: string
  postal?: string
  latitude?: number
  longitude?: number
  timezone?: string
  org?: string
}

export interface GitHubUser {
  id: number
  login: string
  avatar_url: string
  html_url: string
  name?: string
  company?: string
  blog?: string
  location?: string
  bio?: string
  public_repos: number
  followers: number
  following: number
  created_at: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  topics?: string[]
  owner: {
    login: string
    avatar_url: string
  }
}

export interface ExchangeRates {
  base: string
  date: string
  rates: Record<string, number>
}

export interface JokeData {
  type: 'single' | 'twopart'
  joke?: string
  setup?: string
  delivery?: string
}

export interface RandomUser {
  name: {
    title: string
    first: string
    last: string
  }
  email: string
  location: {
    city: string
    country: string
  }
  picture: {
    large: string
    medium: string
    thumbnail: string
  }
}

export interface BoredActivity {
  activity: string
  type: string
  participants: number
  price: number
  link?: string
  key: string
  accessibility: number
}

export interface NameAnalysis {
  nationality: Record<string, number>
  age: number
  gender: string
}

export interface SpaceArticle {
  id: number
  title: string
  url: string
  imageUrl: string
  newsSite: string
  summary: string
  publishedAt: string
}

// === v78 新增：学术研究类型 ===
export interface ArxivPaper {
  id: string
  title: string
  summary: string
  authors: string[]
  categories: string[]
  published: string
  updated: string
  url: string
  pdfUrl: string
  source: string
}

export interface S2Paper {
  id: string
  title: string
  abstract: string
  authors: string[]
  year: string
  doi?: string
  arxivId?: string
  citationCount: number
  referenceCount?: number
  url: string
  publishedDate?: string
  venue?: string
  pdfUrl?: string
  source: string
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
    ipapi: 'https://ipapi.co/json',
    github: 'https://api.github.com',
    exchange: 'https://api.exchangerate-api.com/v4/latest',
    jokeapi: 'https://v2.jokeapi.dev/joke',
    randomuser: 'https://randomuser.me/api',
    advice: 'https://api.adviceslip.com/advice',
    boredapi: 'https://www.boredapi.com/api/activity',
    chucknorris: 'https://api.chucknorris.io/jokes/random',
    nationalize: 'https://api.nationalize.io',
    agify: 'https://api.agify.io',
    genderize: 'https://api.genderize.io',
    catfact: 'https://catfact.ninja/fact',
    dogceo: 'https://dog.ceo/api/breeds/image/random',
    unsplash: 'https://api.unsplash.com/photos/random',
    spaceflight: 'https://api.spaceflightnewsapi.net/v3/articles'
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
      const url = `${this.baseUrls.crypto}/simple/price?ids=${ids}&vs_currencies=usd,cny&include_market_cap=true&include_24hr_change=true&include_24hr_vol=true`
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

  async fetchIPInfo(): Promise<IPInfo | null> {
    try {
      const response = await fetch(this.baseUrls.ipapi)
      return (await response.json()) as IPInfo
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

  // 新增：GitHub API
  async fetchGitHubUser(username: string): Promise<GitHubUser | null> {
    try {
      const response = await fetch(`${this.baseUrls.github}/users/${username}`)
      if (!response.ok) return null
      return (await response.json()) as GitHubUser
    } catch {
      return null
    }
  }

  async fetchGitHubRepos(username: string): Promise<GitHubRepo[] | null> {
    try {
      const response = await fetch(`${this.baseUrls.github}/users/${username}/repos?sort=updated&per_page=10`)
      if (!response.ok) return null
      return (await response.json()) as GitHubRepo[]
    } catch {
      return null
    }
  }

  async searchGitHubRepos(query: string): Promise<GitHubRepo[] | null> {
    try {
      const response = await fetch(`${this.baseUrls.github}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`)
      const data = await response.json()
      return (data.items as GitHubRepo[]) || []
    } catch {
      return null
    }
  }

  // 新增：汇率API
  async fetchExchangeRates(base: string = 'USD'): Promise<ExchangeRates | null> {
    try {
      const response = await fetch(`${this.baseUrls.exchange}/${base}`)
      const data = await response.json()
      if (!data.rates) return null
      return {
        base,
        date: data.date || new Date().toISOString().split('T')[0],
        rates: data.rates,
      }
    } catch {
      return null
    }
  }

  convertCurrency(amount: number, fromRate: number, toRate: number): number {
    return (amount / fromRate) * toRate
  }

  // 新增：笑话API
  async fetchRandomJoke(category: string = 'Programming'): Promise<JokeData | null> {
    try {
      const response = await fetch(`${this.baseUrls.jokeapi}/${category}?safe-mode&type=twopart,single`)
      const data = await response.json()
      
      if (data.type === 'single') {
        return { type: 'single', joke: data.joke }
      } else {
        return { type: 'twopart', setup: data.setup, delivery: data.delivery }
      }
    } catch {
      return null
    }
  }

  // 新增：随机用户生成
  async fetchRandomUser(): Promise<RandomUser | null> {
    try {
      const response = await fetch(`${this.baseUrls.randomuser}?inc=name,email,location,picture`)
      const data = await response.json()
      return (data.results?.[0] as RandomUser) || null
    } catch {
      return null
    }
  }

  // 新增：生活建议API
  async fetchAdvice(): Promise<string | null> {
    try {
      const response = await fetch(this.baseUrls.advice)
      const data = await response.json()
      return data.slip?.advice || null
    } catch {
      return null
    }
  }

  // 新增：无聊活动建议
  async fetchRandomActivity(): Promise<BoredActivity | null> {
    try {
      const response = await fetch(this.baseUrls.boredapi)
      return (await response.json()) as BoredActivity
    } catch {
      return null
    }
  }

  // 新增：Chuck Norris笑话
  async fetchChuckNorrisJoke(): Promise<string | null> {
    try {
      const response = await fetch(this.baseUrls.chucknorris)
      const data = await response.json()
      return data.value || null
    } catch {
      return null
    }
  }

  // 新增：姓名分析API
  async analyzeName(name: string): Promise<NameAnalysis | null> {
    try {
      const [nationalizeData, agifyData, genderizeData] = await Promise.all([
        fetch(`${this.baseUrls.nationalize}/?name=${name}`).then(r => r.json()),
        fetch(`${this.baseUrls.agify}/?name=${name}`).then(r => r.json()),
        fetch(`${this.baseUrls.genderize}/?name=${name}`).then(r => r.json())
      ])

      return {
        nationality: nationalizeData.country?.reduce((acc: Record<string, number>, c: {country_id: string; probability: number}) => {
          acc[c.country_id] = Math.round(c.probability * 100)
          return acc
        }, {}) || {},
        age: agifyData.age || 0,
        gender: genderizeData.gender || 'unknown'
      }
    } catch {
      return null
    }
  }

  // 新增：猫咪知识
  async fetchCatFact(): Promise<string | null> {
    try {
      const response = await fetch(this.baseUrls.catfact)
      const data = await response.json()
      return data.fact || null
    } catch {
      return null
    }
  }

  // 新增：随机狗狗图片
  async fetchRandomDogImage(): Promise<string | null> {
    try {
      const response = await fetch(this.baseUrls.dogceo)
      const data = await response.json()
      return data.message || null
    } catch {
      return null
    }
  }

  // 新增：太空新闻
  async fetchSpaceNews(limit: number = 10): Promise<SpaceArticle[] | null> {
    try {
      const response = await fetch(`${this.baseUrls.spaceflight}?_limit=${limit}`)
      const data = await response.json()
      if (!Array.isArray(data)) return null
      return data.map((item: { id: number; title: string; url: string; imageUrl: string; newsSite: string; summary: string; publishedAt: string }) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        imageUrl: item.imageUrl,
        newsSite: item.newsSite,
        summary: item.summary,
        publishedAt: item.publishedAt,
      }))
    } catch {
      return null
    }
  }

  // === v78 新增：学术研究 API ===
  
  // arXiv 论文搜索
  async searchArxiv(query: string, maxResults: number = 20): Promise<ArxivPaper[] | null> {
    try {
      const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`
      const response = await fetch(url)
      const text = await response.text()
      
      // 解析 Atom XML
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/xml')
      const entries = doc.querySelectorAll('entry')
      
      const papers: ArxivPaper[] = []
      entries.forEach((entry, index) => {
        const title = entry.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() || ''
        const summary = entry.querySelector('summary')?.textContent?.replace(/\s+/g, ' ').trim() || ''
        const published = entry.querySelector('published')?.textContent || ''
        const updated = entry.querySelector('updated')?.textContent || ''
        const id = entry.querySelector('id')?.textContent || ''
        const authors = Array.from(entry.querySelectorAll('author name')).map(a => a.textContent || '')
        const categories = Array.from(entry.querySelectorAll('category')).map(c => c.getAttribute('term') || '')
        const pdfLink = Array.from(entry.querySelectorAll('link')).find(l => l.getAttribute('title') === 'pdf')?.getAttribute('href') || ''
        const absLink = Array.from(entry.querySelectorAll('link')).find(l => l.getAttribute('type') === 'text/html')?.getAttribute('href') || id
        
        papers.push({
          id: `${index}-${id.split('/').pop()?.replace('abs.', '') || ''}`,
          title,
          summary,
          authors,
          categories,
          published,
          updated,
          url: absLink || id,
          pdfUrl: pdfLink,
          source: 'arXiv'
        })
      })
      
      return papers
    } catch {
      return null
    }
  }

  // Semantic Scholar 论文搜索
  async searchSemanticScholar(query: string, limit: number = 20): Promise<S2Paper[] | null> {
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,abstract,year,authors,externalIds,citationCount,referenceCount,url,publicationDate,venue,openAccessPdf`
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.data) return null
      
      return data.data.map((paper: {
        paperId: string
        title: string
        abstract?: string
        year?: string
        authors?: { name: string }[]
        externalIds?: { DOI?: string; ArXiv?: string }
        citationCount?: number
        referenceCount?: number
        url?: string
        publicationDate?: string
        venue?: string
        openAccessPdf?: { url: string } | null
      }) => ({
        id: paper.paperId,
        title: paper.title,
        abstract: paper.abstract || '',
        authors: paper.authors?.map(a => a.name) || [],
        year: paper.year || '',
        doi: paper.externalIds?.DOI || '',
        arxivId: paper.externalIds?.ArXiv || '',
        citationCount: paper.citationCount || 0,
        referenceCount: paper.referenceCount || 0,
        url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
        publishedDate: paper.publicationDate || '',
        venue: paper.venue || '',
        pdfUrl: paper.openAccessPdf?.url || '',
        source: 'Semantic Scholar'
      }))
    } catch {
      return null
    }
  }

  // Semantic Scholar 获取论文引用关系
  async getPaperCitations(paperId: string, limit: number = 20): Promise<S2Paper[] | null> {
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/${paperId}/citations?limit=${limit}&fields=title,year,authors,citationCount,url`
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.data) return null
      
      return data.data.map((item: {
        citingPaper: {
          paperId: string
          title: string
          year?: string
          authors?: { name: string }[]
          citationCount?: number
          url?: string
        }
      }) => ({
        id: item.citingPaper.paperId,
        title: item.citingPaper.title,
        abstract: '',
        authors: item.citingPaper.authors?.map(a => a.name) || [],
        year: item.citingPaper.year || '',
        citationCount: item.citingPaper.citationCount || 0,
        url: item.citingPaper.url || `https://www.semanticscholar.org/paper/${item.citingPaper.paperId}`,
        source: 'Semantic Scholar'
      }))
    } catch {
      return null
    }
  }

  // Semantic Scholar 推荐相关论文
  async getRecommendedPapers(paperId: string, limit: number = 10): Promise<S2Paper[] | null> {
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/${paperId}/recommendations?limit=${limit}&fields=title,abstract,year,authors,citationCount,url`
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.recommendedPapers) return null
      
      return data.recommendedPapers.map((paper: {
        paperId: string
        title: string
        abstract?: string
        year?: string
        authors?: { name: string }[]
        citationCount?: number
        url?: string
      }) => ({
        id: paper.paperId,
        title: paper.title,
        abstract: paper.abstract || '',
        authors: paper.authors?.map(a => a.name) || [],
        year: paper.year || '',
        citationCount: paper.citationCount || 0,
        url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
        source: 'Semantic Scholar'
      }))
    } catch {
      return null
    }
  }

  // 每日学术论文推荐
  async fetchDailyPapers(category: string = 'cs.AI'): Promise<ArxivPaper[] | null> {
    try {
      const url = `https://export.arxiv.org/api/query?search_query=cat:${encodeURIComponent(category)}&max_results=10&sortBy=submittedDate&sortOrder=descending`
      const response = await fetch(url)
      const text = await response.text()
      
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/xml')
      const entries = doc.querySelectorAll('entry')
      
      const papers: ArxivPaper[] = []
      entries.forEach((entry, index) => {
        const title = entry.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() || ''
        const summary = entry.querySelector('summary')?.textContent?.replace(/\s+/g, ' ').trim() || ''
        const published = entry.querySelector('published')?.textContent || ''
        const id = entry.querySelector('id')?.textContent || ''
        const authors = Array.from(entry.querySelectorAll('author name')).map(a => a.textContent || '')
        const categories = Array.from(entry.querySelectorAll('category')).map(c => c.getAttribute('term') || '')
        const pdfLink = Array.from(entry.querySelectorAll('link')).find(l => l.getAttribute('title') === 'pdf')?.getAttribute('href') || ''
        
        papers.push({
          id: `daily-${index}-${id.split('/').pop()?.replace('abs.', '') || ''}`,
          title,
          summary,
          authors,
          categories,
          published,
          updated: published,
          url: id,
          pdfUrl: pdfLink,
          source: 'arXiv Daily'
        })
      })
      
      return papers
    } catch {
      return null
    }
  }

  // 新增：地理位置缓存
  private cachedCoords: { lat: number; lon: number; timestamp: number } | null = null
  private readonly COORDS_CACHE_TTL = 30 * 60 * 1000 // 30分钟

  // 智能获取坐标：优先使用缓存，然后尝试IP定位，最后使用默认
  private async getSmartCoords(): Promise<{ latitude: number; longitude: number }> {
    const now = Date.now()
    if (this.cachedCoords && (now - this.cachedCoords.timestamp) < this.COORDS_CACHE_TTL) {
      return { latitude: this.cachedCoords.lat, longitude: this.cachedCoords.lon }
    }

    // 尝试从IP API获取位置
    try {
      const ipInfo = await this.fetchIPInfo()
      if (ipInfo && ipInfo.latitude && ipInfo.longitude) {
        const coords = { latitude: ipInfo.latitude, longitude: ipInfo.longitude }
        this.cachedCoords = { lat: coords.latitude, lon: coords.longitude, timestamp: now }
        return coords
      }
    } catch {
      // 忽略错误，使用默认值
    }

    // 默认使用中心坐标（北京）
    return { latitude: 39.9042, longitude: 116.4074 }
  }

  // 新增：聚合查询
  async fetchDailySummary(): Promise<{
    weather: WeatherData | null;
    quote: QuoteData | null;
    advice: string | null;
    activity: BoredActivity | null;
  }> {
    const coords = await this.getSmartCoords()
    const [weather, quote, advice, activity] = await Promise.all([
      this.fetchWeather(coords.latitude, coords.longitude),
      this.fetchRandomQuote(),
      this.fetchAdvice(),
      this.fetchRandomActivity()
    ])

    return { weather, quote, advice, activity }
  }

  // === v87 新增：实用工具 API ===

  // URL 缩短服务 (is.gd)
  async shortenUrl(longUrl: string): Promise<string | null> {
    try {
      const url = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`
      const response = await fetch(url)
      if (!response.ok) return null
      const shortened = await response.text()
      return shortened.trim() || null
    } catch {
      return null
    }
  }

  // 密码泄露检查 (HaveIBeenPwned - 使用 k-anonymity)
  async checkPasswordBreached(password: string): Promise<{ breached: boolean; count: number } | null> {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-1', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
      
      const prefix = hashHex.slice(0, 5)
      const suffix = hashHex.slice(5)
      
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
      if (!response.ok) return null
      
      const text = await response.text()
      const lines = text.split('\n')
      
      for (const line of lines) {
        const [suffixPart, countStr] = line.split(':')
        if (suffixPart === suffix) {
          return { breached: true, count: parseInt(countStr, 10) || 0 }
        }
      }
      
      return { breached: false, count: 0 }
    } catch {
      return null
    }
  }

  // 实时汇率转换 (Frankfurter API - 欧洲央行)
  async convertCurrencyRealTime(amount: number, from: string, to: string): Promise<{ result: number; rate: number; date: string } | null> {
    try {
      const url = `${this.baseUrls.exchange}/${from}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.rates || !data.rates[to]) return null
      
      const rate = data.rates[to]
      const result = amount * rate
      
      return {
        result: Math.round(result * 100) / 100,
        rate: Math.round(rate * 10000) / 10000,
        date: data.date || new Date().toISOString().split('T')[0]
      }
    } catch {
      return null
    }
  }

  // 获取支持的货币列表
  getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'NZD',
      'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
      'TWD', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP'
    ]
  }

  // 生成强随机密码
  generateStrongPassword(length: number = 16, options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}): string {
    const opts = { uppercase: true, lowercase: true, numbers: true, symbols: true, ...options }
    const chars: string[] = []
    if (opts.uppercase) chars.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    if (opts.lowercase) chars.push('abcdefghijklmnopqrstuvwxyz')
    if (opts.numbers) chars.push('0123456789')
    if (opts.symbols) chars.push('!@#$%^&*()_+-=[]{}|;:,.<>?')
    
    const allChars = chars.join('')
    if (!allChars) return ''
    
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    
    let password = ''
    for (let i = 0; i < length; i++) {
      password += allChars[array[i] % allChars.length]
    }
    
    return password
  }

  // 密码强度分析
  analyzePasswordStrength(password: string): {
    score: number;
    label: string;
    suggestions: string[];
    entropy: number;
  } {
    let score = 0
    const suggestions: string[] = []
    
    if (password.length >= 8) score += 20
    else suggestions.push('密码长度应至少为 8 位')
    
    if (password.length >= 12) score += 20
    else suggestions.push('建议密码长度为 12 位或更长')
    
    if (/[a-z]/.test(password)) score += 10
    else suggestions.push('应包含小写字母')
    
    if (/[A-Z]/.test(password)) score += 15
    else suggestions.push('应包含大写字母')
    
    if (/[0-9]/.test(password)) score += 15
    else suggestions.push('应包含数字')
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 20
    else suggestions.push('应包含特殊字符')
    
    // 检查常见密码
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein']
    if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
      score -= 30
      suggestions.push('包含常见密码模式，容易被破解')
    }
    
    // 计算熵（粗略估计）
    const charSetSize = 
      (/[a-z]/.test(password) ? 26 : 0) +
      (/[A-Z]/.test(password) ? 26 : 0) +
      (/[0-9]/.test(password) ? 10 : 0) +
      (/[^a-zA-Z0-9]/.test(password) ? 32 : 0)
    const entropy = charSetSize > 0 ? Math.floor(password.length * Math.log2(charSetSize)) : 0
    
    let label = '非常弱'
    if (score >= 80) label = '非常强'
    else if (score >= 65) label = '强'
    else if (score >= 45) label = '中等'
    else if (score >= 25) label = '弱'
    
    return { score: Math.max(0, score), label, suggestions, entropy }
  }

  // 颜色调色板生成 (基于 Coolors API)
  async generateColorPalette(seed?: string): Promise<string[] | null> {
    try {
      const url = seed 
        ? `https://www.coolors.co/api/palette?hex=${seed.replace('#', '')}`
        : 'https://www.coolors.co/api/palette'
      const response = await fetch(url)
      const data = await response.json()
      if (data && data.colors) {
        return data.colors.map((c: { hex: { value: string } }) => c.hex.value)
      }
      return null
    } catch {
      return null
    }
  }

  // HTTP 状态码查询
  getHttpStatusInfo(code: number): { category: string; description: string } {
    const codes: Record<number, { category: string; description: string }> = {
      200: { category: '成功', description: '请求成功' },
      201: { category: '成功', description: '资源创建成功' },
      204: { category: '成功', description: '请求成功但无返回内容' },
      301: { category: '重定向', description: '永久重定向' },
      302: { category: '重定向', description: '临时重定向' },
      400: { category: '客户端错误', description: '请求参数错误' },
      401: { category: '客户端错误', description: '未授权' },
      403: { category: '客户端错误', description: '禁止访问' },
      404: { category: '客户端错误', description: '资源未找到' },
      405: { category: '客户端错误', description: '方法不允许' },
      429: { category: '客户端错误', description: '请求过于频繁' },
      500: { category: '服务器错误', description: '内部服务器错误' },
      502: { category: '服务器错误', description: '网关错误' },
      503: { category: '服务器错误', description: '服务不可用' },
      504: { category: '服务器错误', description: '网关超时' },
    }
    return codes[code] || { category: '未知', description: '未知状态码' }
  }

  // === 新增：实用工具方法 ===

  // UUID v4 生成
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // 时间戳格式化
  formatTimestamp(timestamp: number, format: 'relative' | 'absolute' | 'iso' = 'relative'): string {
    const date = new Date(timestamp)
    if (format === 'iso') return date.toISOString()
    if (format === 'absolute') return date.toLocaleString('zh-CN')
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 7) return `${days} 天前`
    return date.toLocaleDateString('zh-CN')
  }

  // Base64 编码/解码
  base64Encode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
  }

  base64Decode(str: string): string {
    return decodeURIComponent(escape(atob(str)))
  }

  // URL 编码/解码
  urlEncode(str: string): string {
    return encodeURIComponent(str)
  }

  urlDecode(str: string): string {
    return decodeURIComponent(str)
  }

  // JSON 格式化/压缩
  formatJSON(json: string, indent: number = 2): string {
    try {
      const parsed = JSON.parse(json)
      return JSON.stringify(parsed, null, indent)
    } catch {
      return '无效的 JSON 字符串'
    }
  }

  minifyJSON(json: string): string {
    try {
      const parsed = JSON.parse(json)
      return JSON.stringify(parsed)
    } catch {
      return '无效的 JSON 字符串'
    }
  }

  // 文本统计
  analyzeText(text: string): {
    characters: number
    charactersNoSpaces: number
    words: number
    lines: number
    paragraphs: number
    readingTime: number
  } {
    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text.split('\n').length
    const paragraphs = text.split(/\n\n+/).length
    const readingTime = Math.ceil(words / 200)
    
    return { characters, charactersNoSpaces, words, lines, paragraphs, readingTime }
  }

  // 单位转换
  convertUnits(value: number, from: string, to: string): number | null {
    const conversions: Record<string, Record<string, number>> = {
      length: {
        meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001,
        mile: 1609.34, yard: 0.9144, foot: 0.3048, inch: 0.0254
      },
      weight: {
        kilogram: 1, gram: 0.001, milligram: 0.000001,
        pound: 0.453592, ounce: 0.0283495, ton: 1000
      },
      temperature: { celsius: 1, fahrenheit: 1, kelvin: 1 },
      volume: {
        liter: 1, milliliter: 0.001, gallon: 3.78541,
        quart: 0.946353, cup: 0.236588
      }
    }

    const categoryMap: Record<string, string> = {
      meter: 'length', kilometer: 'length', centimeter: 'length', millimeter: 'length',
      mile: 'length', yard: 'length', foot: 'length', inch: 'length',
      kilogram: 'weight', gram: 'weight', milligram: 'weight',
      pound: 'weight', ounce: 'weight', ton: 'weight',
      celsius: 'temperature', fahrenheit: 'temperature', kelvin: 'temperature',
      liter: 'volume', milliliter: 'volume', gallon: 'volume',
      quart: 'volume', cup: 'volume'
    }

    const category = categoryMap[from]
    if (!category || !conversions[category]) return null

    if (category === 'temperature') {
      let celsius = value
      if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9
      else if (from === 'kelvin') celsius = value - 273.15
      
      if (to === 'fahrenheit') return celsius * 9 / 5 + 32
      if (to === 'kelvin') return celsius + 273.15
      return celsius
    }

    const rates = conversions[category]
    const baseValue = value * rates[from]
    return baseValue / rates[to]
  }

  // 颜色转换
  hexToRGB(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  rgbToHSL(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }

  // 数字格式化
  formatNumber(num: number, decimals: number = 0, locale: string = 'zh-CN'): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  // 文件大小格式化
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024
      i++
    }
    return `${size.toFixed(2)} ${units[i]}`
  }

  // 获取随机颜色
  getRandomColor(): string {
    const hue = Math.floor(Math.random() * 360)
    const saturation = 60 + Math.floor(Math.random() * 40)
    const lightness = 40 + Math.floor(Math.random() * 30)
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  // 获取 Contrast Color（用于背景色的对比文字色）
  getContrastColor(hexColor: string): string {
    const rgb = this.hexToRGB(hexColor)
    if (!rgb) return '#000000'
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Cron 表达式解析
  parseCronExpression(expression: string): {
    isValid: boolean
    description: string
    nextRun?: Date
  } {
    const parts = expression.trim().split(/\s+/)
    if (parts.length !== 5 && parts.length !== 6) {
      return { isValid: false, description: 'Cron 表达式必须有 5 或 6 个字段' }
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts.slice(0, 5)
    
    const descriptions: string[] = []
    
    if (minute === '*') descriptions.push('每分钟')
    else descriptions.push(`在第 ${minute} 分钟`)
    
    if (hour === '*') descriptions.push('每小时')
    else descriptions.push(`${hour} 点`)
    
    if (dayOfMonth === '*') descriptions.push('每天')
    else descriptions.push(`${dayOfMonth} 号`)
    
    if (month === '*') descriptions.push('每月')
    else descriptions.push(`${month} 月`)
    
    if (dayOfWeek === '*') descriptions.push('每周每天')
    else descriptions.push(`星期${dayOfWeek}`)

    return {
      isValid: true,
      description: descriptions.join('，')
    }
  }

  // 计算两个日期之间的差异
  dateDiff(date1: Date, date2: Date): {
    years: number
    months: number
    days: number
    hours: number
    minutes: number
    seconds: number
    totalDays: number
  } {
    const diffMs = Math.abs(date2.getTime() - date1.getTime())
    const totalSeconds = Math.floor(diffMs / 1000)
    const totalMinutes = Math.floor(totalSeconds / 60)
    const totalHours = Math.floor(totalMinutes / 60)
    const totalDays = Math.floor(totalHours / 24)

    return {
      years: Math.floor(totalDays / 365.25),
      months: Math.floor((totalDays % 365.25) / 30.44),
      days: totalDays,
      hours: totalHours,
      minutes: totalMinutes,
      seconds: totalSeconds,
      totalDays
    }
  }

  // 获取时区信息
  getTimezoneInfo(): {
    timezone: string
    offset: number
    dst: boolean
    abbreviation: string
  } {
    const now = new Date()
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const offset = -now.getTimezoneOffset() / 60
    const history = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short'
    }).formatToParts(now).find(part => part.type === 'timeZoneName')
    const abbreviation = history?.value || ''
    
    return {
      timezone,
      offset: offset >= 0 ? offset : offset,
      dst: now.getTimezoneOffset() !== this.getStandardOffset(timezone),
      abbreviation
    }
  }

  private getStandardOffset(timezone: string): number {
    const jan = new Date(new Date().getFullYear(), 0, 1)
    const dec = new Date(new Date().getFullYear(), 11, 1)
    const janOffset = this.getOffsetForDate(jan, timezone)
    const decOffset = this.getOffsetForDate(dec, timezone)
    return Math.max(janOffset, decOffset)
  }

  private getOffsetForDate(date: Date, timezone: string): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    })
    const parts = dtf.formatToParts(date)
    const map: Record<string, string> = {}
    parts.forEach(part => { if (part.type !== 'literal') map[part.type] = part.value })
    const asUTC = Date.UTC(
      Number(map.year), Number(map.month) - 1, Number(map.day),
      Number(map.hour), Number(map.minute), Number(map.second)
    )
    return Math.round((asUTC - date.getTime()) / 60000)
  }

  // 键盘事件代码映射
  getKeyCode(key: string): string {
    const keyMap: Record<string, string> = {
      ' ': 'Space', 'Control': 'Ctrl', 'ArrowUp': '↑', 'ArrowDown': '↓',
      'ArrowLeft': '←', 'ArrowRight': '→', 'Escape': 'Esc',
      'Enter': 'Enter', 'Backspace': 'Backspace', 'Delete': 'Delete',
      'Tab': 'Tab', 'CapsLock': 'Caps'
    }
    return keyMap[key] || key
  }

  // 防抖函数
  debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    return (...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), wait)
    }
  }

  // 节流函数
  throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastTime = 0
    return (...args: Parameters<T>) => {
      const now = Date.now()
      const remaining = wait - (now - lastTime)
      if (remaining <= 0) {
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null }
        lastTime = now
        func(...args)
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastTime = Date.now()
          timeoutId = null
          func(...args)
        }, remaining)
      }
    }
  }
}

export const apiService = ApiService.getInstance()