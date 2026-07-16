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
  openWeatherMap: {
    key: import.meta.env.VITE_OPENWEATHERMAP_API_KEY || 'demo_key',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
  },
  newsApi: {
    key: import.meta.env.VITE_NEWSAPI_KEY || 'demo_key',
    baseUrl: 'https://newsapi.org/v2',
  },
  exchangeRate: {
    key: import.meta.env.VITE_EXCHANGERATE_API_KEY || 'demo_key',
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
  /** 公共 NASA APOD 服务，DEMO_KEY 自带较低速率，但一般用户使用足够 */
  nasa: {
    key: import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY',
    baseUrl: 'https://api.nasa.gov/planetary',
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
