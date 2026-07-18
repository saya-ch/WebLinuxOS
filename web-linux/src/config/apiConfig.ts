/**
 * API 配置文件
 *
 * 安全说明：本项目集成的所有 API 优先使用无需认证（key-less）的公开端点，
 * 这是为了让代码可直接部署在 GitHub Pages 等纯静态环境而无需额外的后端
 * 代理或环境变量配置。
 *
 * 对于少数需要 key 的服务（如 OpenWeatherMap、NewsAPI、ExchangeRate-API），
 * 默认使用的 key 仅是公开的演示 key，强烈建议在 `.env` 中覆盖：
 *
 *   VITE_OPENWEATHERMAP_API_KEY=your_key
 *   VITE_NEWSAPI_KEY=your_key
 *   VITE_EXCHANGERATE_API_KEY=your_key
 *
 * 大部分用户无需配置即可使用所有功能；只有频繁调用受限服务时才需要替换 key。
 */

export const API_CONFIG = {
  openMeteo: {
    baseUrl: 'https://api.open-meteo.com/v1',
  },
  openWeatherMap: {
    key: import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
  },
  newsApi: {
    key: import.meta.env.VITE_NEWSAPI_KEY || '',
    baseUrl: 'https://newsapi.org/v2',
  },
  exchangeRate: {
    key: import.meta.env.VITE_EXCHANGERATE_API_KEY || '',
    baseUrl: 'https://v6.exchangerate-api.com/v6',
  },
  coinGecko: {
    baseUrl: import.meta.env.VITE_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
  },
  yahooFinance: {
    baseUrl: import.meta.env.VITE_YAHOO_FINANCE_API_URL || 'https://query1.finance.yahoo.com/v7',
  },
  myMemory: {
    baseUrl: 'https://api.mymemory.translated.net',
  },
  ipify: {
    baseUrl: 'https://api.ipify.org',
  },
  jokeApi: {
    baseUrl: 'https://v2.jokeapi.dev',
  },
  quotable: {
    baseUrl: 'https://api.quotable.io',
  },
  dictionaryApi: {
    baseUrl: 'https://api.dictionaryapi.dev/api/v2',
  },
  nasa: {
    key: import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY',
    baseUrl: 'https://api.nasa.gov/planetary',
  },
  hackerNews: {
    baseUrl: 'https://hacker-news.firebaseio.com/v0',
  },
  githubApi: {
    baseUrl: 'https://api.github.com',
  },
  wikipedia: {
    baseUrl: 'https://en.wikipedia.org/api/rest_v1',
    zhBaseUrl: 'https://zh.wikipedia.org/api/rest_v1',
  },
  spaceflightNews: {
    baseUrl: 'https://api.spaceflightnewsapi.net/v4',
  },
  adviceSlip: {
    baseUrl: 'https://api.adviceslip.com',
  },
  catFact: {
    baseUrl: 'https://catfact.ninja',
  },
  dogCeo: {
    baseUrl: 'https://dog.ceo/api',
  },
  randomUser: {
    baseUrl: 'https://randomuser.me/api',
  },
  genderize: {
    baseUrl: 'https://api.genderize.io',
  },
  nationalize: {
    baseUrl: 'https://api.nationalize.io',
  },
  agify: {
    baseUrl: 'https://api.agify.io',
  },
  bingSearch: {
    baseUrl: 'https://api.bing.microsoft.com/v7.0',
  },
  duckDuckGo: {
    baseUrl: 'https://api.duckduckgo.com',
  },
  restCountries: {
    baseUrl: 'https://restcountries.com/v3.1',
  },
  pokemon: {
    baseUrl: 'https://pokeapi.co/api/v2',
  },
  starWars: {
    baseUrl: 'https://swapi.dev/api',
  },
  chuckNorris: {
    baseUrl: 'https://api.chucknorris.io/jokes',
  },
  dadJoke: {
    baseUrl: 'https://icanhazdadjoke.com',
  },
  numbersApi: {
    baseUrl: 'http://numbersapi.com',
  },
  jsonPlaceholder: {
    baseUrl: 'https://jsonplaceholder.typicode.com',
  },
  httpBin: {
    baseUrl: 'https://httpbin.org',
  },
  /**
   * Pollinations.ai — 免费、无需 API Key 的 AI 文本与图像生成服务
   * 文档: https://pollinations.ai
   * 用途: 真实 AI 对话、代码生成、图像生成
   */
  pollinations: {
    textBaseUrl: 'https://text.pollinations.ai',
    imageBaseUrl: 'https://image.pollinations.ai',
    defaultModel: 'openai',
    visionModel: 'openai-large',
    imageModel: 'flux',
  },
  /**
   * Open-Meteo Geocoding — 城市名经纬度查询（免费、无需 key）
   */
  openMeteoGeocoding: {
    baseUrl: 'https://geocoding-api.open-meteo.com/v1',
  },
  /**
   * Frankfurter — 欧洲央行公开汇率接口（免费、无需 key）
   */
  frankfurter: {
    baseUrl: 'https://api.frankfurter.app/v1',
  },
  /**
   * GitHub Gist — 用于云剪贴板 / 笔记同步（匿名读取免费）
   */
  githubGist: {
    baseUrl: 'https://api.github.com/gists',
  },
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

export function handleApiError(error: unknown, serviceName: string): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return `${serviceName} 请求超时`
    }
    return `${serviceName} 错误: ${error.message}`
  }
  return `${serviceName} 发生未知错误`
}
