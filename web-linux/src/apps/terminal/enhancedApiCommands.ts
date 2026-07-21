import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error('HTTP error')
    return await response.json()
  } catch {
    return null
  }
}

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'

    const weatherData = await fetchJson<{
      main: { temp: number; feels_like: number; humidity: number; pressure: number }
      weather: Array<{ description: string }>
      wind: { speed: number }
      sys: { sunrise: number; sunset: number }
      name: string
      visibility: number
    }>(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=7453d2a4d2c38600a8f2d835348471b7&units=metric&lang=zh_cn`)

    if (!weatherData || !weatherData.main) {
      return {
        output: [
          `无法获取 ${city} 的天气信息`,
          '',
          '支持的城市: Beijing, Shanghai, Tokyo, New York, London, Paris, Sydney...',
          '',
          '示例: weather Shanghai',
        ].join('\n')
      }
    }

    const { main, weather, wind, sys, name, visibility } = weatherData
    const temp = Math.round(main.temp)
    const feelsLike = Math.round(main.feels_like)
    const humidity = main.humidity
    const pressure = main.pressure
    const condition = weather[0]?.description || '未知'
    const windSpeed = wind?.speed || 0
    const sunrise = new Date((sys?.sunrise || 0) * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const sunset = new Date((sys?.sunset || 0) * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    return {
      output: [
        `${name} 天气`,
        '',
        `温度: ${temp}°C (体感 ${feelsLike}°C)`,
        `天气: ${condition}`,
        `湿度: ${humidity}%`,
        `气压: ${pressure} hPa`,
        `风速: ${windSpeed} m/s`,
        `能见度: ${visibility ? visibility / 1000 : 'N/A'} km`,
        `日出: ${sunrise}`,
        `日落: ${sunset}`,
      ].join('\n')
    }
  },
  description: '查询天气信息',
  usage: 'weather [城市]',
  examples: ['weather', 'weather Shanghai', 'weather Tokyo']
})

registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const symbol = (args[0] || 'BTC').toUpperCase()

    const cryptoData = await fetchJson<Array<{
      name: string
      symbol: string
      current_price: number
      price_change_percentage_24h: number
      market_cap: number
      total_volume: number
      high_24h: number
      low_24h: number
    }>>(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${symbol.toLowerCase()}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`)

    if (!cryptoData || cryptoData.length === 0) {
      return {
        output: [
          '加密货币行情',
          '',
          '支持的币种: BTC, ETH, SOL, XRP, DOGE, ADA, DOT...',
          '',
          '示例: crypto BTC',
          '      crypto ETH',
        ].join('\n')
      }
    }

    const coin = cryptoData[0]
    const price = coin.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'
    const change24h = coin.price_change_percentage_24h || 0
    const marketCap = coin.market_cap ? '$' + (coin.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'
    const volume = coin.total_volume ? '$' + (coin.total_volume / 1e9).toFixed(2) + 'B' : 'N/A'
    const high24h = coin.high_24h?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'
    const low24h = coin.low_24h?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'

    return {
      output: [
        `${coin.name} (${coin.symbol?.toUpperCase()})`,
        '',
        `价格: $${price}`,
        `24h涨跌: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
        `市值: ${marketCap}`,
        `24h成交量: ${volume}`,
        `24h最高: $${high24h}`,
        `24h最低: $${low24h}`,
      ].join('\n')
    }
  },
  description: '查询加密货币行情',
  usage: 'crypto [币种]',
  examples: ['crypto BTC', 'crypto ETH', 'crypto SOL']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    const newsData = await fetchJson<{
      articles: Array<{
        title: string
        source: { name: string }
        description: string
      }>
    }>(`https://newsapi.org/v2/top-headlines?country=us&apiKey=7f437f497632433ab4e81970f0b6d63a&pageSize=10`)

    if (!newsData?.articles || newsData.articles.length === 0) {
      return {
        output: [
          '头条新闻',
          '',
          '暂无新闻数据',
          '',
          '提示: 需要联网访问新闻API',
        ].join('\n')
      }
    }

    const articles = newsData.articles.slice(0, 10)
    const output = ['头条新闻', '', '='.repeat(60), '']
    
    articles.forEach((article, index) => {
      output.push(`${index + 1}. ${article.title}`)
      output.push(`   ${article.source?.name || 'Unknown'}`)
      output.push(`   ${article.description || ''}`)
      output.push('')
    })
    
    output.push('='.repeat(60))
    output.push('数据来源: NewsAPI')

    return { output: output.join('\n') }
  },
  description: '查看头条新闻',
  usage: 'news',
  examples: ['news']
})

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return {
        output: [
          '翻译工具',
          '',
          '用法: translate <文本>',
          '',
          '示例: translate Hello World',
          '      translate 你好世界',
        ].join('\n')
      }
    }

    const isChinese = /[\u4e00-\u9fa5]/.test(text)

    const translateData = await fetchJson<{
      responseData: { translatedText: string }
    }>(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${isChinese ? 'zh|en' : 'en|zh'}`)

    const result = translateData?.responseData?.translatedText || '翻译失败'

    return {
      output: [
        `原文: ${text}`,
        `译文: ${result}`,
      ].join('\n')
    }
  },
  description: '翻译文本',
  usage: 'translate <文本>',
  examples: ['translate Hello World', 'translate 你好世界']
})

registerCommand('ipinfo', {
  handler: async (): Promise<CommandResult> => {
    const ipData = await fetchJson<{ ip: string }>('https://api.ipify.org?format=json')

    const ip = ipData?.ip || '未知'
    const geoData = await fetchJson<{
      country_name: string
      city: string
      region: string
      timezone: string
      org: string
      latitude: number
      longitude: number
    }>(`https://ipapi.co/${ip}/json/`)

    return {
      output: [
        'IP地址信息',
        '',
        `IP地址: ${ip}`,
        `国家: ${geoData?.country_name || '未知'}`,
        `城市: ${geoData?.city || '未知'}`,
        `地区: ${geoData?.region || '未知'}`,
        `时区: ${geoData?.timezone || '未知'}`,
        `ISP: ${geoData?.org || '未知'}`,
        `经纬度: ${geoData?.latitude || 'N/A'}, ${geoData?.longitude || 'N/A'}`,
      ].join('\n')
    }
  },
  description: '查看当前IP地址信息',
  usage: 'ipinfo',
  examples: ['ipinfo']
})

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const target = (args[0] || 'CNY').toUpperCase()

    const rates = await fetchJson<{
      rates: Record<string, number>
      result: string
    }>('https://open.er-api.com/v6/latest/USD')

    if (!rates?.rates || rates.result !== 'success') {
      return {
        output: [
          '汇率查询',
          '',
          '无法获取汇率数据',
        ].join('\n')
      }
    }

    const targetRate = rates.rates[target]
    if (!targetRate) {
      return {
        output: [
          `不支持的货币: ${target}`,
          '',
          '常用货币: CNY, EUR, JPY, GBP, KRW, AUD, CAD...',
        ].join('\n')
      }
    }

    const usdToTarget = targetRate
    const targetToUsd = (1 / targetRate).toFixed(4)

    return {
      output: [
        `汇率查询 - ${target}`,
        '',
        `1 USD = ${usdToTarget} ${target}`,
        `1 ${target} = ${targetToUsd} USD`,
      ].join('\n')
    }
  },
  description: '查询汇率',
  usage: 'currency [货币代码]',
  examples: ['currency CNY', 'currency EUR', 'currency JPY']
})

registerCommand('holiday', {
  handler: async (): Promise<CommandResult> => {
    const today = new Date()
    const year = today.getFullYear()

    const holidays = await fetchJson<Array<{
      date: string
      localName: string
      name: string
    }>>(`https://date.nager.at/api/v3/PublicHolidays/${year}/CN`)

    if (!holidays || holidays.length === 0) {
      return {
        output: [
          '中国节假日',
          '',
          `${year}年节假日数据暂不可用`,
        ].join('\n')
      }
    }

    const upcoming = holidays.filter(h => {
      const [hYear, hMonth, hDay] = h.date.split('-').map(Number)
      return hYear > year || (hYear === year && hMonth > (today.getMonth() + 1)) || (hYear === year && hMonth === (today.getMonth() + 1) && hDay >= today.getDate())
    }).slice(0, 5)

    const output = ['中国节假日', '', '='.repeat(40), '']
    
    upcoming.forEach(h => {
      output.push(`${h.date} ${h.localName}`)
      if (h.name) output.push(`   ${h.name}`)
      output.push('')
    })
    
    output.push('='.repeat(40))

    return { output: output.join('\n') }
  },
  description: '查看中国节假日',
  usage: 'holiday',
  examples: ['holiday']
})

registerCommand('trivia', {
  handler: async (): Promise<CommandResult> => {
    const trivia = await fetchJson<Array<{
      question: string
      answer: string
    }>>('https://api.api-ninjas.com/v1/trivia?limit=1')

    if (!trivia || trivia.length === 0) {
      return { output: '暂无趣味知识' }
    }

    const item = trivia[0]
    return {
      output: [
        '🤔 趣味知识',
        '',
        `${item.question}`,
        '',
        `答案: ${item.answer}`,
      ].join('\n')
    }
  },
  description: '获取随机趣味知识',
  usage: 'trivia',
  examples: ['trivia']
})

registerCommand('joke', {
  handler: async (): Promise<CommandResult> => {
    const joke = await fetchJson<{ value: string }>('https://api.chucknorris.io/jokes/random')

    return {
      output: [
        '😄 笑话',
        '',
        joke?.value || '暂无笑话',
      ].join('\n')
    }
  },
  description: '获取随机笑话',
  usage: 'joke',
  examples: ['joke']
})

registerCommand('timezone', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'

    const cityTimezones: Record<string, string> = {
      'beijing': 'Asia/Shanghai',
      'shanghai': 'Asia/Shanghai',
      'tokyo': 'Asia/Tokyo',
      'seoul': 'Asia/Seoul',
      'newyork': 'America/New_York',
      'losangeles': 'America/Los_Angeles',
      'london': 'Europe/London',
      'paris': 'Europe/Paris',
      'sydney': 'Australia/Sydney',
      'moscow': 'Europe/Moscow',
      'dubai': 'Asia/Dubai',
      'singapore': 'Asia/Singapore',
      'hongkong': 'Asia/Hong_Kong',
    }

    const timezone = cityTimezones[city.toLowerCase()] || 'Asia/Shanghai'
    const now = new Date()
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone,
    }
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      timeZone: timezone,
    }

    return {
      output: [
        `${city} 时间`,
        '',
        `时区: ${timezone}`,
        `时间: ${now.toLocaleTimeString('zh-CN', timeOptions)}`,
        `日期: ${now.toLocaleDateString('zh-CN', dateOptions)}`,
      ].join('\n')
    }
  },
  description: '查询世界各城市时间',
  usage: 'timezone [城市]',
  examples: ['timezone Tokyo', 'timezone London', 'timezone New York']
})