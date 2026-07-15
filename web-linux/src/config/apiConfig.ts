export const API_CONFIG = {
  openWeatherMap: {
    key: import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '7453d2a40a48c6b51a06392940dd7386',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
  },
  newsApi: {
    key: import.meta.env.VITE_NEWSAPI_KEY || '45470c1193a34d3daa26d653457e6060',
    baseUrl: 'https://newsapi.org/v2',
  },
  exchangeRate: {
    key: import.meta.env.VITE_EXCHANGERATE_API_KEY || '86068a5c8465929628e66543',
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
}

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
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