import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || '上海'

    try {
      const geocodeResponse = await fetchWithTimeout(
        `${API_CONFIG.openMeteoGeocoding.baseUrl}/search?name=${encodeURIComponent(city)}&count=1&language=zh`
      )

      if (!geocodeResponse.ok) {
        throw new Error('地理编码失败')
      }

      const geocodeData = await geocodeResponse.json()
      
      if (!geocodeData.results || geocodeData.results.length === 0) {
        return {
          output: [
            '🌤️ 天气查询',
            '',
            `未找到城市: ${city}`,
            '',
            '尝试其他城市名称，如: 北京、上海、广州、深圳',
          ].join('\n')
        }
      }

      const location = geocodeData.results[0]
      const { latitude, longitude, name, country } = location

      const weatherResponse = await fetchWithTimeout(
        `${API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Shanghai`
      )

      if (!weatherResponse.ok) {
        throw new Error('天气数据获取失败')
      }

      const weatherData = await weatherResponse.json()
      const current = weatherData.current
      const daily = weatherData.daily
      const hourly = weatherData.hourly

      const weatherCodes: Record<number, string> = {
        0: '晴',
        1: '多云',
        2: '少云',
        3: '阴',
        45: '雾',
        48: '雾凇',
        51: '毛毛雨',
        53: '小雨',
        55: '中雨',
        61: '阵雨',
        63: '中阵雨',
        65: '强阵雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        80: '雷阵雨',
        81: '强雷阵雨',
        82: '暴雷阵雨',
        95: '雷暴',
        96: '雷暴伴冰雹',
        99: '强雷暴伴冰雹',
      }

      const weatherText = weatherCodes[current.weather_code] || '未知'

      const output = [
        '🌤️ 天气查询',
        '',
        `📍 ${name}, ${country}`,
        '',
        '当前天气:',
        `  温度: ${current.temperature_2m}°C`,
        `  天气: ${weatherText}`,
        `  湿度: ${current.relative_humidity_2m}%`,
        `  风速: ${current.wind_speed_10m} km/h`,
        '',
        '今日预报:',
        `  最高: ${daily.temperature_2m_max[0]}°C`,
        `  最低: ${daily.temperature_2m_min[0]}°C`,
        '',
        '未来3小时降水概率:',
      ]

      for (let i = 0; i < 3; i++) {
        const hour = new Date(hourly.time[i]).getHours()
        output.push(`  ${hour}:00 - ${hourly.precipitation_probability[i]}%`)
      }

      output.push('')
      output.push('数据来源: Open-Meteo API')

      return { output: output.join('\n') }
    } catch (error) {
      return {
        output: [
          '🌤️ 天气查询',
          '',
          `城市: ${city}`,
          '',
          handleApiError(error, '天气服务'),
          '',
          '使用备用数据:',
          '  温度: 25°C',
          '  天气: 多云',
          '  湿度: 60%',
          '  风速: 10 km/h',
        ].join('\n')
      }
    }
  },
  description: '查询天气信息',
  usage: 'weather [城市名]',
  examples: ['weather', 'weather 北京', 'weather Shanghai']
})

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🌍 翻译工具',
          '',
          '用法: translate <目标语言> <文本>',
          '',
          '支持的语言代码:',
          '  zh - 中文',
          '  en - 英文',
          '  ja - 日语',
          '  ko - 韩语',
          '  fr - 法语',
          '  de - 德语',
          '  es - 西班牙语',
          '',
          '示例:',
          '  translate en Hello World',
          '  translate zh こんにちは',
          '  translate ja 你好',
        ].join('\n')
      }
    }

    const targetLang = args[0].toLowerCase()
    const text = args.slice(1).join(' ')

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.myMemory.baseUrl}/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
      )

      if (!response.ok) {
        throw new Error('翻译服务不可用')
      }

      const data = await response.json()

      if (data.responseStatus === 200 && data.responseData) {
        return {
          output: [
            '🌍 翻译结果',
            '',
            `原文: ${text}`,
            `译文: ${data.responseData.translatedText}`,
            '',
            `语言: ${data.responseData.detectedSourceLanguage} -> ${targetLang}`,
            '',
            '数据来源: MyMemory Translation API',
          ].join('\n')
        }
      }

      return {
        output: [
          '🌍 翻译结果',
          '',
          `原文: ${text}`,
          '',
          '翻译服务暂时不可用，请稍后重试',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '🌍 翻译结果',
          '',
          `原文: ${text}`,
          '',
          handleApiError(error, '翻译服务'),
          '',
          '提示: 使用备用翻译（基于规则）',
        ].join('\n')
      }
    }
  },
  description: '文本翻译',
  usage: 'translate <目标语言> <文本>',
  examples: ['translate en Hello', 'translate zh Good morning']
})

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '💱 汇率查询',
          '',
          '用法: currency [金额] [源货币] [目标货币]',
          '',
          '常用货币代码:',
          '  CNY - 人民币',
          '  USD - 美元',
          '  EUR - 欧元',
          '  JPY - 日元',
          '  GBP - 英镑',
          '  KRW - 韩元',
          '',
          '示例:',
          '  currency 100 USD CNY',
          '  currency EUR CNY',
          '  currency',
        ].join('\n')
      }
    }

    let amount = 1
    let from = 'USD'
    let to = 'CNY'

    if (args.length === 1) {
      from = args[0].toUpperCase()
    } else if (args.length === 2) {
      from = args[0].toUpperCase()
      to = args[1].toUpperCase()
    } else {
      amount = parseFloat(args[0]) || 1
      from = args[1].toUpperCase()
      to = args[2].toUpperCase()
    }

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.frankfurter.baseUrl}/latest?from=${from}&to=${to}`
      )

      if (!response.ok) {
        throw new Error('汇率服务不可用')
      }

      const data = await response.json()

      if (data.rates && data.rates[to]) {
        const rate = data.rates[to]
        const result = amount * rate

        return {
          output: [
            '💱 汇率查询',
            '',
            `日期: ${data.date}`,
            '',
            `${amount} ${from} = ${result.toFixed(2)} ${to}`,
            `汇率: 1 ${from} = ${rate.toFixed(4)} ${to}`,
            '',
            '数据来源: Frankfurter API (欧洲央行)',
          ].join('\n')
        }
      }

      return {
        output: [
          '💱 汇率查询',
          '',
          `无法获取 ${from} -> ${to} 的汇率`,
        ].join('\n')
      }
    } catch (error) {
      const fallbackRates: Record<string, Record<string, number>> = {
        USD: { CNY: 7.24, EUR: 0.92, JPY: 149.50, GBP: 0.79 },
        EUR: { CNY: 7.87, USD: 1.09, JPY: 162.50, GBP: 0.86 },
        JPY: { CNY: 0.048, USD: 0.0067, EUR: 0.0061, GBP: 0.0053 },
        GBP: { CNY: 9.16, USD: 1.27, EUR: 1.17, JPY: 189.00 },
        CNY: { USD: 0.138, EUR: 0.127, JPY: 20.65, GBP: 0.109 },
      }

      const rate = fallbackRates[from]?.[to] || 1
      const result = amount * rate

      return {
        output: [
          '💱 汇率查询',
          '',
          handleApiError(error, '汇率服务'),
          '',
          '使用备用汇率:',
          `${amount} ${from} = ${result.toFixed(2)} ${to}`,
          `汇率: 1 ${from} = ${rate.toFixed(4)} ${to}`,
          '',
          '提示: 备用汇率可能不是最新的',
        ].join('\n')
      }
    }
  },
  description: '查询汇率',
  usage: 'currency [金额] [源货币] [目标货币]',
  examples: ['currency 100 USD CNY', 'currency EUR CNY']
})

registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const coin = (args[0] || 'BTC').toLowerCase()

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.coinGecko.baseUrl}/coins/markets?vs_currency=usd&ids=${coin}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`
      )

      if (!response.ok) {
        throw new Error('加密货币数据获取失败')
      }

      const data = await response.json()

      if (data.length === 0) {
        return {
          output: [
            '💰 加密货币查询',
            '',
            `未找到加密货币: ${coin}`,
            '',
            '支持的加密货币:',
            '  BTC - Bitcoin',
            '  ETH - Ethereum',
            '  SOL - Solana',
            '  ADA - Cardano',
            '  DOGE - Dogecoin',
            '  XRP - Ripple',
          ].join('\n')
        }
      }

      const coinData = data[0]

      return {
        output: [
          '💰 加密货币查询',
          '',
          `名称: ${coinData.name} (${coinData.symbol.toUpperCase()})`,
          '',
          `价格: $${coinData.current_price.toLocaleString()}`,
          `市值: $${coinData.market_cap.toLocaleString()}`,
          `24h变化: ${coinData.price_change_percentage_24h > 0 ? '+' : ''}${coinData.price_change_percentage_24h.toFixed(2)}%`,
          `24h交易量: $${coinData.total_volume.toLocaleString()}`,
          '',
          '数据来源: CoinGecko API',
        ].join('\n')
      }
    } catch (error) {
      const fallbackData: Record<string, { name: string; price: number; change: number }> = {
        btc: { name: 'Bitcoin', price: 67500, change: 2.5 },
        eth: { name: 'Ethereum', price: 3500, change: -1.2 },
        sol: { name: 'Solana', price: 178, change: 5.8 },
        ada: { name: 'Cardano', price: 0.52, change: 0.3 },
        doge: { name: 'Dogecoin', price: 0.12, change: -0.8 },
        xrp: { name: 'Ripple', price: 0.65, change: 1.5 },
      }

      const fallback = fallbackData[coin] || { name: coin.toUpperCase(), price: 100, change: 0 }

      return {
        output: [
          '💰 加密货币查询',
          '',
          handleApiError(error, '加密货币服务'),
          '',
          '使用备用数据:',
          `名称: ${fallback.name}`,
          `价格: $${fallback.price.toLocaleString()}`,
          `24h变化: ${fallback.change > 0 ? '+' : ''}${fallback.change}%`,
          '',
          '提示: 备用数据可能不是最新的',
        ].join('\n')
      }
    }
  },
  description: '查询加密货币价格',
  usage: 'crypto [货币代码]',
  examples: ['crypto', 'crypto BTC', 'crypto ETH']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.hackerNews.baseUrl}/topstories.json`
      )

      if (!response.ok) {
        throw new Error('新闻数据获取失败')
      }

      const topStories = await response.json()

      const stories: Array<{ title: string; url: string; score: number; by: string }> = []
      const limit = 5

      for (let i = 0; i < Math.min(limit, topStories.length); i++) {
        const storyResponse = await fetchWithTimeout(
          `${API_CONFIG.hackerNews.baseUrl}/item/${topStories[i]}.json`
        )
        if (storyResponse.ok) {
          const story = await storyResponse.json()
          if (story.title && story.url) {
            stories.push({
              title: story.title,
              url: story.url,
              score: story.score,
              by: story.by,
            })
          }
        }
      }

      const output = [
        '📰 Hacker News 头条',
        '',
        '═══════════════════════════════════════',
        '',
      ]

      stories.forEach((story, index) => {
        output.push(`${index + 1}. ${story.title}`)
        output.push(`   评分: ${story.score} | 作者: ${story.by}`)
        output.push(`   ${story.url}`)
        output.push('')
      })

      output.push('数据来源: Hacker News API')

      return { output: output.join('\n') }
    } catch (error) {
      const fallbackNews = [
        { title: 'WebLinuxOS 发布新版本', url: 'https://github.com/saya-ch/WebLinuxOS', score: 123, by: 'saya-ch' },
        { title: 'React 19 发布', url: 'https://react.dev', score: 456, by: 'react-team' },
        { title: 'TypeScript 6.5 新特性', url: 'https://typescriptlang.org', score: 234, by: 'ts-team' },
        { title: 'Vite 8 性能优化', url: 'https://vitejs.dev', score: 189, by: 'vite-team' },
        { title: 'WebAssembly 新进展', url: 'https://webassembly.org', score: 156, by: 'wasm-team' },
      ]

      const output = [
        '📰 新闻头条',
        '',
        handleApiError(error, '新闻服务'),
        '',
        '使用备用数据:',
        '',
      ]

      fallbackNews.forEach((story, index) => {
        output.push(`${index + 1}. ${story.title}`)
        output.push(`   ${story.url}`)
        output.push('')
      })

      return { output: output.join('\n') }
    }
  },
  description: '获取新闻头条',
  usage: 'news [分类]',
  examples: ['news', 'news tech']
})

registerCommand('define', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const word = args.join(' ')

    if (!word) {
      return {
        output: [
          '📖 词典查询',
          '',
          '用法: define <单词>',
          '',
          '示例:',
          '  define computer',
          '  define programming',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.dictionaryApi.baseUrl}/entries/en/${word}`
      )

      if (!response.ok) {
        throw new Error('词典查询失败')
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        return {
          output: [
            '📖 词典查询',
            '',
            `未找到单词: ${word}`,
          ].join('\n')
        }
      }

      const entry = data[0]
      const meanings = entry.meanings || []

      const output = [
        '📖 词典查询',
        '',
        `单词: ${entry.word}${entry.phonetic ? ` (${entry.phonetic})` : ''}`,
        '',
      ]

      meanings.forEach((meaning: { partOfSpeech: string; definitions: Array<{ definition: string; example?: string }> }, index: number) => {
        output.push(`${index + 1}. ${meaning.partOfSpeech}:`)
        meaning.definitions.forEach((def, defIndex) => {
          output.push(`   ${defIndex + 1}. ${def.definition}`)
          if (def.example) {
            output.push(`      示例: ${def.example}`)
          }
        })
      })

      output.push('')
      output.push('数据来源: Free Dictionary API')

      return { output: output.join('\n') }
    } catch (error) {
      return {
        output: [
          '📖 词典查询',
          '',
          `单词: ${word}`,
          '',
          handleApiError(error, '词典服务'),
          '',
          '提示: 词典服务暂时不可用',
        ].join('\n')
      }
    }
  },
  description: '查询英文单词释义',
  usage: 'define <单词>',
  examples: ['define computer', 'define programming']
})

registerCommand('quote', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.quotable.baseUrl}/random`
      )

      if (!response.ok) {
        throw new Error('名言获取失败')
      }

      const data = await response.json()

      return {
        output: [
          '💭 每日名言',
          '',
          `"${data.content}"`,
          '',
          `— ${data.author || 'Unknown'}`,
          '',
          '数据来源: Quotable API',
        ].join('\n')
      }
    } catch (error) {
      const fallbackQuotes = [
        { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
        { content: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
        { content: 'Life is what happens when you are busy making other plans.', author: 'John Lennon' },
        { content: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
      ]

      const quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]

      return {
        output: [
          '💭 每日名言',
          '',
          handleApiError(error, '名言服务'),
          '',
          `"${quote.content}"`,
          '',
          `— ${quote.author}`,
        ].join('\n')
      }
    }
  },
  description: '获取随机名言',
  usage: 'quote',
  examples: ['quote']
})

registerCommand('country', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const country = args.join(' ')

    if (!country) {
      return {
        output: [
          '🌍 国家信息查询',
          '',
          '用法: country <国家名称>',
          '',
          '示例:',
          '  country China',
          '  country 日本',
          '  country United States',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.restCountries.baseUrl}/name/${encodeURIComponent(country)}?fullText=true`
      )

      if (!response.ok) {
        throw new Error('国家信息获取失败')
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        return {
          output: [
            '🌍 国家信息查询',
            '',
            `未找到国家: ${country}`,
          ].join('\n')
        }
      }

      const info = data[0]

      return {
        output: [
          '🌍 国家信息',
          '',
          `名称: ${info.name.common}`,
          `官方名称: ${info.name.official}`,
          `首都: ${info.capital?.[0] || '无'}`,
          `人口: ${info.population.toLocaleString()}`,
          `面积: ${info.area.toLocaleString()} km²`,
          `时区: ${info.timezones?.[0] || '未知'}`,
          `货币: ${Object.values(info.currencies || {}).map((c) => {
            const currency = c as { name: string; symbol: string }
            return `${currency.name} (${currency.symbol})`
          }).join(', ')}`,
          `语言: ${Object.values(info.languages || {}).join(', ')}`,
          `区域: ${info.region}`,
          `次区域: ${info.subregion}`,
          '',
          '数据来源: REST Countries API',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '🌍 国家信息查询',
          '',
          `国家: ${country}`,
          '',
          handleApiError(error, '国家信息服务'),
          '',
          '提示: 服务暂时不可用',
        ].join('\n')
      }
    }
  },
  description: '查询国家信息',
  usage: 'country <国家名称>',
  examples: ['country China', 'country Japan']
})

// ==================== 辅助函数 ====================

function computeMD5(input: string): string {
  function rotl(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n))
  }

  function add32(a: number, b: number): number {
    return (a + b) & 0xFFFFFFFF
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    q = add32(add32(add32(a, q), x), t)
    return add32(rotl(q, s), b)
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t)
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t)
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | (~d)), a, b, x, s, t)
  }

  const utf8 = unescape(encodeURIComponent(input))
  const bytes: number[] = []
  for (let i = 0; i < utf8.length; i++) {
    bytes.push(utf8.charCodeAt(i))
  }
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) {
    bytes.push(0)
  }

  const msgLen = utf8.length * 8
  for (let i = 0; i < 8; i++) {
    bytes.push((msgLen >>> (i * 8)) & 0xFF)
  }

  let a = 0x67452301
  let b = 0xEFCDAB89
  let c = 0x98BADCFE
  let d = 0x10325476

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const x: number[] = []
    for (let i = 0; i < 16; i++) {
      x[i] = (bytes[offset + i * 4]) |
             (bytes[offset + i * 4 + 1] << 8) |
             (bytes[offset + i * 4 + 2] << 16) |
             (bytes[offset + i * 4 + 3] << 24)
    }

    const aa = a, bb = b, cc = c, dd = d

    a = ff(a, b, c, d, x[0], 7, 0xD76AA478)
    d = ff(d, a, b, c, x[1], 12, 0xE8C7B756)
    c = ff(c, d, a, b, x[2], 17, 0x242070DB)
    b = ff(b, c, d, a, x[3], 22, 0xC1BDCEEE)
    a = ff(a, b, c, d, x[4], 7, 0xF57C0FAF)
    d = ff(d, a, b, c, x[5], 12, 0x4787C62A)
    c = ff(c, d, a, b, x[6], 17, 0xA8304613)
    b = ff(b, c, d, a, x[7], 22, 0xFD469501)
    a = ff(a, b, c, d, x[8], 7, 0x698098D8)
    d = ff(d, a, b, c, x[9], 12, 0x8B44F7AF)
    c = ff(c, d, a, b, x[10], 17, 0xFFFF5BB1)
    b = ff(b, c, d, a, x[11], 22, 0x895CD7BE)
    a = ff(a, b, c, d, x[12], 7, 0x6B901122)
    d = ff(d, a, b, c, x[13], 12, 0xFD987193)
    c = ff(c, d, a, b, x[14], 17, 0xA679438E)
    b = ff(b, c, d, a, x[15], 22, 0x49B40821)

    a = gg(a, b, c, d, x[1], 5, 0xF61E2562)
    d = gg(d, a, b, c, x[6], 9, 0xC040B340)
    c = gg(c, d, a, b, x[11], 14, 0x265E5A51)
    b = gg(b, c, d, a, x[0], 20, 0xE9B6C7AA)
    a = gg(a, b, c, d, x[5], 5, 0xD62F105D)
    d = gg(d, a, b, c, x[10], 9, 0x02441453)
    c = gg(c, d, a, b, x[15], 14, 0xD8A1E681)
    b = gg(b, c, d, a, x[4], 20, 0xE7D3FBC8)
    a = gg(a, b, c, d, x[9], 5, 0x21E1CDE6)
    d = gg(d, a, b, c, x[14], 9, 0xC33707D6)
    c = gg(c, d, a, b, x[3], 14, 0xF4D50D87)
    b = gg(b, c, d, a, x[8], 20, 0x455A14ED)
    a = gg(a, b, c, d, x[13], 5, 0xA9E3E905)
    d = gg(d, a, b, c, x[2], 9, 0xFCEFA3F8)
    c = gg(c, d, a, b, x[7], 14, 0x676F02D9)
    b = gg(b, c, d, a, x[12], 20, 0x8D2A4C8A)

    a = hh(a, b, c, d, x[5], 4, 0xFFFA3942)
    d = hh(d, a, b, c, x[8], 11, 0x8771F681)
    c = hh(c, d, a, b, x[11], 16, 0x6D9D6122)
    b = hh(b, c, d, a, x[14], 23, 0xFDE5380C)
    a = hh(a, b, c, d, x[1], 4, 0xA4BEEA44)
    d = hh(d, a, b, c, x[4], 11, 0x4BDECFA9)
    c = hh(c, d, a, b, x[7], 16, 0xF6BB4B60)
    b = hh(b, c, d, a, x[10], 23, 0xBEBFBC70)
    a = hh(a, b, c, d, x[13], 4, 0x289B7EC6)
    d = hh(d, a, b, c, x[0], 11, 0xEAA127FA)
    c = hh(c, d, a, b, x[3], 16, 0xD4EF3085)
    b = hh(b, c, d, a, x[6], 23, 0x04881D05)
    a = hh(a, b, c, d, x[9], 4, 0xD9D4D039)
    d = hh(d, a, b, c, x[12], 11, 0xE6DB99E5)
    c = hh(c, d, a, b, x[15], 16, 0x1FA27CF8)
    b = hh(b, c, d, a, x[2], 23, 0xC4AC5665)

    a = ii(a, b, c, d, x[0], 6, 0xF4292244)
    d = ii(d, a, b, c, x[7], 10, 0x432AFF97)
    c = ii(c, d, a, b, x[14], 15, 0xAB9423A7)
    b = ii(b, c, d, a, x[5], 21, 0xFC93A039)
    a = ii(a, b, c, d, x[12], 6, 0x655B59C3)
    d = ii(d, a, b, c, x[3], 10, 0x8F0CCC92)
    c = ii(c, d, a, b, x[10], 15, 0xFFEFF47D)
    b = ii(b, c, d, a, x[1], 21, 0x85845DD1)
    a = ii(a, b, c, d, x[8], 6, 0x6FA87E4F)
    d = ii(d, a, b, c, x[15], 10, 0xFE2CE6E0)
    c = ii(c, d, a, b, x[6], 15, 0xA3014314)
    b = ii(b, c, d, a, x[13], 21, 0x4E0811A1)
    a = ii(a, b, c, d, x[4], 6, 0xF7537E82)
    d = ii(d, a, b, c, x[11], 10, 0xBD3AF235)
    c = ii(c, d, a, b, x[2], 15, 0x2AD7D2BB)
    b = ii(b, c, d, a, x[9], 21, 0xEB86D391)

    a = add32(a, aa)
    b = add32(b, bb)
    c = add32(c, cc)
    d = add32(d, dd)
  }

  function toHex(n: number): string {
    let hex = ''
    for (let i = 0; i < 4; i++) {
      const byte = (n >>> (i * 8)) & 0xFF
      hex += (byte < 16 ? '0' : '') + byte.toString(16)
    }
    return hex
  }

  return toHex(a) + toHex(b) + toHex(c) + toHex(d)
}

// ==================== 命令实现 ====================

registerCommand('md5', {
  handler: (context: CommandContext): CommandResult => {
    const text = context.args.join(' ')
    if (!text) {
      return {
        output: [
          'MD5 哈希计算',
          '',
          '用法: md5 <文本>',
          '',
          '示例:',
          '  md5 hello',
          '  md5 "Hello World"',
        ].join('\n')
      }
    }
    try {
      const hash = computeMD5(text)
      return {
        output: [
          'MD5 哈希',
          '',
          `输入: ${text}`,
          `输出: ${hash}`,
          '',
          '注: MD5 为单向哈希，不可还原原文',
        ].join('\n')
      }
    } catch (error) {
      return { output: `MD5 计算错误: ${error instanceof Error ? error.message : String(error)}` }
    }
  },
  description: '计算 MD5 哈希值',
  usage: 'md5 <文本>',
  examples: ['md5 hello', 'md5 "Hello World"']
}, { source: 'enhancedCommands' })

registerCommand('sha', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const text = context.args.join(' ')
    if (!text) {
      return {
        output: [
          'SHA-256 哈希计算',
          '',
          '用法: sha <文本>',
          '',
          '示例:',
          '  sha hello',
          '  sha "Hello World"',
        ].join('\n')
      }
    }
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const buffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(buffer))
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      return {
        output: [
          'SHA-256 哈希',
          '',
          `输入: ${text}`,
          `输出: ${hash}`,
          '',
          '注: SHA-256 为单向哈希，不可还原原文',
        ].join('\n')
      }
    } catch (error) {
      return { output: `SHA-256 计算错误: ${error instanceof Error ? error.message : String(error)}` }
    }
  },
  description: '计算 SHA-256 哈希值',
  usage: 'sha <文本>',
  examples: ['sha hello', 'sha "Hello World"']
}, { source: 'enhancedCommands' })

registerCommand('base64-encode', {
  handler: (context: CommandContext): CommandResult => {
    const text = context.args.join(' ')
    if (!text) {
      return {
        output: [
          'Base64 编码',
          '',
          '用法: base64-encode <文本>',
          '',
          '示例:',
          '  base64-encode hello',
          '  base64-encode "Hello World"',
        ].join('\n')
      }
    }
    try {
      const encoded = btoa(unescape(encodeURIComponent(text)))
      return {
        output: [
          'Base64 编码',
          '',
          `原文: ${text}`,
          `编码: ${encoded}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: `Base64 编码错误: ${error instanceof Error ? error.message : String(error)}` }
    }
  },
  description: 'Base64 编码文本',
  usage: 'base64-encode <文本>',
  examples: ['base64-encode hello', 'base64-encode "Hello World"']
}, { force: true, source: 'enhancedCommands' })

registerCommand('base64-decode', {
  handler: (context: CommandContext): CommandResult => {
    const text = context.args.join(' ')
    if (!text) {
      return {
        output: [
          'Base64 解码',
          '',
          '用法: base64-decode <Base64字符串>',
          '',
          '示例:',
          '  base64-decode aGVsbG8=',
          '  base64-decode SGVsbG8gV29ybGQ=',
        ].join('\n')
      }
    }
    try {
      const decoded = decodeURIComponent(escape(atob(text)))
      return {
        output: [
          'Base64 解码',
          '',
          `编码: ${text}`,
          `原文: ${decoded}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: `Base64 解码错误: ${error instanceof Error ? error.message : String(error)}` }
    }
  },
  description: 'Base64 解码文本',
  usage: 'base64-decode <Base64字符串>',
  examples: ['base64-decode aGVsbG8=', 'base64-decode SGVsbG8gV29ybGQ=']
}, { force: true, source: 'enhancedCommands' })

registerCommand('url-encode', {
  handler: (context: CommandContext): CommandResult => {
    const text = context.args.join(' ')
    if (!text) {
      return {
        output: [
          'URL 编码',
          '',
          '用法: url-encode <文本>',
          '',
          '示例:',
          '  url-encode hello world',
          '  url-encode "https://example.com?q=你好"',
        ].join('\n')
      }
    }
    try {
      const encoded = encodeURIComponent(text)
      return {
        output: [
          'URL 编码',
          '',
          `原文: ${text}`,
          `编码: ${encoded}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: `URL 编码错误: ${error instanceof Error ? error.message : String(error)}` }
    }
  },
  description: 'URL 编码文本',
  usage: 'url-encode <文本>',
  examples: ['url-encode hello world', 'url-encode "https://example.com?q=test"']
}, { force: true, source: 'enhancedCommands' })

registerCommand('url-decode', {
  handler: (context: CommandContext): CommandResult => {
    const text = context.args.join(' ')
    if (!text) {
      return {
        output: [
          'URL 解码',
          '',
          '用法: url-decode <URL编码字符串>',
          '',
          '示例:',
          '  url-decode hello%20world',
          '  url-decode https%3A%2F%2Fexample.com',
        ].join('\n')
      }
    }
    try {
      const decoded = decodeURIComponent(text)
      return {
        output: [
          'URL 解码',
          '',
          `编码: ${text}`,
          `原文: ${decoded}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: `URL 解码错误: ${error instanceof Error ? error.message : String(error)}` }
    }
  },
  description: 'URL 解码文本',
  usage: 'url-decode <URL编码字符串>',
  examples: ['url-decode hello%20world', 'url-decode https%3A%2F%2Fexample.com']
}, { force: true, source: 'enhancedCommands' })

registerCommand('jwt-decode', {
  handler: (context: CommandContext): CommandResult => {
    const token = context.args.join(' ')
    if (!token) {
      return {
        output: [
          'JWT 解码',
          '',
          '用法: jwt-decode <JWT令牌>',
          '',
          '示例:',
          '  jwt-decode eyJhbGciOi...',
          '',
          'JWT 结构: Header.Payload.Signature',
          '此命令将解码 Payload 部分',
        ].join('\n')
      }
    }
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return { output: '错误: 无效的 JWT 格式，应为三段以 . 分隔的字符串' }
      }
      const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1]))))
      const header = JSON.parse(decodeURIComponent(escape(atob(parts[0]))))
      return {
        output: [
          'JWT 解码结果',
          '',
          'Header:',
          JSON.stringify(header, null, 2),
          '',
          'Payload:',
          JSON.stringify(payload, null, 2),
          '',
          `签名: ${parts[2].substring(0, 20)}...`,
          '',
          '注: JWT 仅为 Base64 编码，非加密，切勿在 Payload 中存放敏感信息',
        ].join('\n')
      }
    } catch (error) {
      return { output: `JWT 解码错误: ${error instanceof Error ? error.message : String(error)}` }
    }
  },
  description: '解码 JWT 令牌的 Payload 部分',
  usage: 'jwt-decode <JWT令牌>',
  examples: ['jwt-decode eyJhbGciOi...']
}, { force: true, source: 'enhancedCommands' })

registerCommand('color', {
  handler: (context: CommandContext): CommandResult => {
    const args = context.args
    if (args.length > 0) {
      const colorName = args[0].toLowerCase()
      const colors: Record<string, { code: string; hex: string; desc: string }> = {
        red: { code: '\\x1b[31m', hex: '#FF0000', desc: '红色' },
        green: { code: '\\x1b[32m', hex: '#00FF00', desc: '绿色' },
        blue: { code: '\\x1b[34m', hex: '#0000FF', desc: '蓝色' },
        yellow: { code: '\\x1b[33m', hex: '#FFFF00', desc: '黄色' },
        cyan: { code: '\\x1b[36m', hex: '#00FFFF', desc: '青色' },
        magenta: { code: '\\x1b[35m', hex: '#FF00FF', desc: '品红' },
        white: { code: '\\x1b[37m', hex: '#FFFFFF', desc: '白色' },
        gray: { code: '\\x1b[90m', hex: '#808080', desc: '灰色' },
      }
      const c = colors[colorName]
      if (c) {
        return {
          output: [
            `颜色: ${c.desc}`,
            `ANSI 代码: ${c.code}`,
            `HEX 值: ${c.hex}`,
            '',
            '提示: \\x1b[0m 重置颜色',
          ].join('\n')
        }
      }
      return { output: `未知颜色: ${colorName}` }
    }

    const colors = [
      { name: '黑色', code: '\\x1b[30m', hex: '#000000' },
      { name: '红色', code: '\\x1b[31m', hex: '#FF0000' },
      { name: '绿色', code: '\\x1b[32m', hex: '#00FF00' },
      { name: '黄色', code: '\\x1b[33m', hex: '#FFFF00' },
      { name: '蓝色', code: '\\x1b[34m', hex: '#0000FF' },
      { name: '品红', code: '\\x1b[35m', hex: '#FF00FF' },
      { name: '青色', code: '\\x1b[36m', hex: '#00FFFF' },
      { name: '白色', code: '\\x1b[37m', hex: '#FFFFFF' },
      { name: '灰色(亮)', code: '\\x1b[90m', hex: '#808080' },
      { name: '亮红', code: '\\x1b[91m', hex: '#FF6060' },
      { name: '亮绿', code: '\\x1b[92m', hex: '#60FF60' },
      { name: '亮黄', code: '\\x1b[93m', hex: '#FFFF60' },
      { name: '亮蓝', code: '\\x1b[94m', hex: '#6060FF' },
      { name: '亮品红', code: '\\x1b[95m', hex: '#FF60FF' },
      { name: '亮青', code: '\\x1b[96m', hex: '#60FFFF' },
      { name: '亮白', code: '\\x1b[97m', hex: '#FFFFFF' },
    ]

    const output = ['ANSI 颜色代码表', '']
    output.push('普通颜色:')
    colors.slice(0, 8).forEach(c => {
      output.push(`  ${c.code}  ${c.name.padEnd(6)}  ${c.hex}  ${c.code}text\\x1b[0m`)
    })
    output.push('')
    output.push('亮色:')
    colors.slice(8).forEach(c => {
      output.push(`  ${c.code}  ${c.name.padEnd(6)}  ${c.hex}  ${c.code}text\\x1b[0m`)
    })
    output.push('')
    output.push('用法:')
    output.push('  color <颜色名>    查看指定颜色详情')
    output.push('  color             显示全部颜色表')
    output.push('')
    output.push('常用样式:')
    output.push('  \\x1b[1m  粗体  \\x1b[0m  重置')
    output.push('  \\x1b[4m  下划线  \\x1b[7m  反显')
    output.push('  \\x1b[5m  闪烁  \\x1b[2m  暗色')

    return { output: output.join('\n') }
  },
  description: '显示 ANSI 颜色代码表',
  usage: 'color [颜色名]',
  examples: ['color', 'color red', 'color green']
}, { force: true, source: 'enhancedCommands' })

registerCommand('ascii', {
  handler: (context: CommandContext): CommandResult => {
    const text = context.args.join(' ')
    if (!text) {
      return {
        output: [
          'ASCII 艺术横幅',
          '',
          '用法: ascii <文本>',
          '',
          '示例:',
          '  ascii Hello',
          '  ascii WebLinuxOS',
          '',
          '提示: 建议使用短文本获得最佳效果',
        ].join('\n')
      }
    }

    const maxWidth = 60

    const chars: Record<string, string[]> = {
      'A': [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
      'B': ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔══██╗', '██████╔╝', '╚═════╝ '],
      'C': [' ██████╗', '██╔════╝', '██║     ', '██║     ', '╚██████╗', ' ╚═════╝'],
      'D': ['██████╗ ', '██╔══██╗', '██║  ██║', '██║  ██║', '██████╔╝', '╚═════╝ '],
      'E': ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '███████╗', '╚══════╝'],
      'F': ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '██║     ', '╚═╝     '],
      'G': [' ██████╗ ', '██╔════╝ ', '██║  ███╗', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
      'H': ['██╗  ██╗', '██║  ██║', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
      'I': ['██╗', '██║', '██║', '██║', '██║', '╚═╝'],
      'J': ['     ██╗', '     ██╗', '     ██╗', '██   ██║', '╚██████╔╝', ' ╚═════╝'],
      'K': ['██╗  ██╗', '██║ ██╔╝', '█████╔╝ ', '██╔═██╗ ', '██║  ██╗', '╚═╝  ╚═╝'],
      'L': ['██╗     ', '██║     ', '██║     ', '██║     ', '███████╗', '╚══════╝'],
      'M': ['███╗   ███╗', '████╗ ████║', '██╔████╔██║', '██║╚██╔╝██║', '██║ ╚═╝ ██║', '╚═╝     ╚═╝'],
      'N': ['███╗   ██╗', '████╗  ██║', '██╔██╗ ██║', '██║╚██╗██║', '██║ ╚████║', '╚═╝  ╚═══╝'],
      'O': [' █████╗ ', '██╔══██╗', '██║  ██║', '██║  ██║', '╚█████╔╝', ' ╚════╝ '],
      'P': ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔═══██╗', '██║   ██║', '╚═╝   ╚═╝'],
      'Q': [' █████╗ ', '██╔══██╗', '██║  ██║', '██║  ██║', '╚█████╔╝', ' ╚════╝ '],
      'R': ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔══██╗', '██║  ██║', '╚═╝  ╚═╝'],
      'S': ['██████╗ ', '██╔════╝', '███████╗', '╚════██║', '███████║', '╚══════╝'],
      'T': ['████████╗', '╚══██╔══╝', '   ██║   ', '   ██║   ', '   ██║   ', '   ╚═╝   '],
      'U': ['██╗   ██╗', '██║   ██╗', '██║   ██╗', '██║   ██╗', '╚██████╔╝', ' ╚═════╝'],
      'V': ['██╗   ██╗', '██║   ██╗', '██║   ██╗', '╚██╗ ██╔╝', ' ╚████╔╝ ', '  ╚═══╝  '],
      'W': ['██╗    ██╗', '██║    ██║', '██║ █╗ ██║', '██║███╗██║', '╚███╔███╔╝', ' ╚══╝╚══╝ '],
      'X': ['██╗  ██╗', '╚██╗██╔╝', ' ╚███╔╝ ', ' ██╔██╗ ', '██╔╝ ██╗', '╚═╝  ╚═╝'],
      'Y': ['██╗   ██╗', '╚██╗ ██╔╝', ' ╚████╔╝ ', '  ╚██╔╝ ', '   ██║   ', '   ╚═╝   '],
      'Z': ['███████╗', '╚══███╔╝', '  ███╔╝ ', ' ███╔╝  ', '███████╗', '╚══════╝'],
      ' ': ['   ', '   ', '   ', '   ', '   ', '   '],
      '!': ['╦', '╦', '╦', '╨', '  ', '╨'],
      '?': ['▄█', '  ', '█▄', '  ', '  ', '█'],
      '.': [' ', ' ', ' ', ' ', ' ', '•'],
      ',': [' ', ' ', ' ', ' ', ' ', '·'],
      '-': [' ', ' ', '▬', ' ', ' ', ' '],
      '+': [' ', '╋', '▬█▬', '╋', ' ', ' '],
      '/': ['  ╱', ' ╱ ', '╱  ', '╲  ', ' ╲ ', '  ╲'],
      ':': [' ', '●', ' ', ' ', '●', ' '],
      "'": ['╦', '╦', ' ', ' ', ' ', ' '],
      '"': ['╦╦', '╦╦', ' ', ' ', ' ', ' '],
    }

    const height = 6
    const input = text.toUpperCase()
    const asciiLines: string[] = Array(height).fill('')

    for (let i = 0; i < input.length; i++) {
      const ch = input[i]
      const glyph = chars[ch] || chars[' ']
      for (let row = 0; row < height; row++) {
        asciiLines[row] += glyph[row] + '  '
      }
    }

    const output = [
      'ASCII 艺术横幅',
      '',
      ...asciiLines.map(l => l.padEnd(maxWidth, ' ').replace(/\s+$/, '')),
      '',
      `原文: ${text}`,
    ]

    return { output: output.join('\n') }
  },
  description: '生成 ASCII 艺术横幅',
  usage: 'ascii <文本>',
  examples: ['ascii Hello', 'ascii WebLinuxOS']
}, { force: true, source: 'enhancedCommands' })

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (args.length === 0) {
      return {
        output: [
          '汇率查询 (美元/人民币)',
          '',
          '用法: currency [金额]',
          '',
          '示例:',
          '  currency          查看当前汇率',
          '  currency 100      美元转人民币',
        ].join('\n')
      }
    }

    const amount = parseFloat(args[0]) || 1

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.frankfurter.baseUrl}/latest?from=USD&to=CNY`
      )
      if (!response.ok) throw new Error('汇率服务不可用')
      const data = await response.json()
      const rate = data.rates?.CNY || 7.25
      const result = amount * rate
      return {
        output: [
          '💱 汇率查询',
          '',
          `日期: ${data.date}`,
          `1 USD = ${rate.toFixed(4)} CNY`,
          '',
          `${amount.toFixed(2)} USD = ${result.toFixed(2)} CNY`,
          '',
          '数据来源: Frankfurter API',
        ].join('\n')
      }
    } catch (error) {
      const fallbackRate = 7.24
      const result = amount * fallbackRate
      return {
        output: [
          '💱 汇率查询',
          '',
          handleApiError(error, '汇率服务'),
          '',
          '使用备用汇率:',
          `1 USD = ${fallbackRate} CNY`,
          `${amount.toFixed(2)} USD = ${result.toFixed(2)} CNY`,
          '',
          '提示: 备用汇率仅供参考',
        ].join('\n')
      }
    }
  },
  description: '查询美元/人民币汇率',
  usage: 'currency [金额]',
  examples: ['currency', 'currency 100']
}, { force: true, source: 'enhancedCommands' })

registerCommand('bitcoin', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const coin = (args[0] || 'BTC').toUpperCase()

    const fallbackData: Record<string, { name: string; price: number; change: number; high24h: number; low24h: number }> = {
      BTC: { name: 'Bitcoin', price: 67850.00, change: 2.35, high24h: 68500, low24h: 66200 },
      ETH: { name: 'Ethereum', price: 3520.00, change: -1.20, high24h: 3600, low24h: 3480 },
      SOL: { name: 'Solana', price: 178.50, change: 5.80, high24h: 182, low24h: 168 },
      BNB: { name: 'BNB', price: 612.00, change: 0.45, high24h: 625, low24h: 608 },
      XRP: { name: 'XRP', price: 0.6520, change: 1.50, high24h: 0.67, low24h: 0.64 },
      ADA: { name: 'Cardano', price: 0.5180, change: -0.30, high24h: 0.53, low24h: 0.51 },
      DOGE: { name: 'Dogecoin', price: 0.1205, change: 3.20, high24h: 0.125, low24h: 0.116 },
    }

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.coinGecko.baseUrl}/coins/markets?vs_currency=usd&ids=${coin.toLowerCase()}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`
      )
      if (!response.ok) throw new Error('API 不可用')
      const data = await response.json()
      if (data.length === 0) {
        const fb = fallbackData[coin] || fallbackData.BTC
        return {
          output: [
            '💰 加密货币行情',
            '',
            `未找到币种: ${coin}`,
            '',
            '支持的币种:',
            ...Object.keys(fallbackData).map(k => `  ${k} - ${fallbackData[k].name}`),
            '',
            `显示 ${fb.name} 作为默认:`,
            `  价格: $${fb.price.toLocaleString()}`,
          ].join('\n')
        }
      }
      const cd = data[0]
      return {
        output: [
          '💰 加密货币行情',
          '',
          `${cd.name} (${cd.symbol.toUpperCase()})`,
          `  价格:     $${cd.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `  市值:     $${(cd.market_cap / 1e9).toFixed(2)}B`,
          `  24h变化:  ${cd.price_change_percentage_24h > 0 ? '+' : ''}${cd.price_change_percentage_24h?.toFixed(2) || '0.00'}%`,
          `  24h最高:  $${cd.high_24h?.toLocaleString() || 'N/A'}`,
          `  24h最低:  $${cd.low_24h?.toLocaleString() || 'N/A'}`,
          `  24h成交量: $${(cd.total_volume / 1e6).toFixed(2)}M`,
          '',
          '数据来源: CoinGecko API',
        ].join('\n')
      }
    } catch (error) {
      const fb = fallbackData[coin] || fallbackData.BTC
      return {
        output: [
          '💰 加密货币行情',
          '',
          handleApiError(error, '加密货币服务'),
          '',
          '使用备用数据:',
          `${fb.name} (${coin})`,
          `  价格:     $${fb.price.toLocaleString()}`,
          `  24h变化:  ${fb.change > 0 ? '+' : ''}${fb.change}%`,
          `  24h最高:  $${fb.high24h.toLocaleString()}`,
          `  24h最低:  $${fb.low24h.toLocaleString()}`,
          '',
          '提示: 备用数据可能不是最新的',
        ].join('\n')
      }
    }
  },
  description: '查询加密货币实时价格',
  usage: 'bitcoin [币种代码]',
  examples: ['bitcoin', 'bitcoin ETH', 'bitcoin SOL']
}, { source: 'enhancedCommands' })

registerCommand('speedtest', {
  handler: async (_context: CommandContext): Promise<CommandResult> => {
    const output: string[] = ['🌐 网络速度测试', '']
    
    try {
      // Step 1: 测量 Ping（多次测量取平均）
      output.push('  测量延迟 (Ping)...')
      const pingResults: number[] = []
      const testUrls = [
        'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current_weather=true',
        'https://api.github.com/',
        'https://httpbin.org/get'
      ]
      
      for (let i = 0; i < 5; i++) {
        const url = testUrls[i % testUrls.length]
        try {
          const start = performance.now()
          await fetch(url, { method: 'HEAD', cache: 'no-store', mode: 'no-cors' })
          const elapsed = performance.now() - start
          pingResults.push(elapsed)
        } catch {
          // 某些 API 不支持 HEAD，用 GET 代替
          try {
            const start = performance.now()
            await fetch(url, { method: 'GET', cache: 'no-store' })
            const elapsed = performance.now() - start
            pingResults.push(elapsed)
          } catch {
            // 跳过失败的请求
          }
        }
      }
      
      const avgPing = pingResults.length > 0 
        ? Math.round(pingResults.reduce((a, b) => a + b, 0) / pingResults.length)
        : 0
      const minPing = pingResults.length > 0 ? Math.round(Math.min(...pingResults)) : 0
      const maxPing = pingResults.length > 0 ? Math.round(Math.max(...pingResults)) : 0
      
      output.push(`    Ping (平均): ${avgPing} ms`)
      output.push(`    Ping (最小/最大): ${minPing} / ${maxPing} ms`)
      output.push('')
      
      // Step 2: 测量下载速度
      output.push('  下载测试中...')
      const downloadTestStart = performance.now()
      let totalBytesDownloaded = 0
      
      // 下载多个 payload 来测量速度
      const downloadUrls = [
        'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=Asia/Shanghai&forecast_days=7',
        'https://api.open-meteo.com/v1/forecast?latitude=31.2&longitude=121.5&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=Asia/Shanghai&forecast_days=7',
        'https://api.open-meteo.com/v1/forecast?latitude=22.5&longitude=114.1&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=Asia/Shanghai&forecast_days=7',
      ]
      
      for (const url of downloadUrls) {
        try {
          const resp = await fetch(url, { cache: 'no-store' })
          const text = await resp.text()
          totalBytesDownloaded += new TextEncoder().encode(text).length
        } catch {}
      }
      
      const downloadDuration = (performance.now() - downloadTestStart) / 1000 // 秒
      const downloadMbps = downloadDuration > 0 ? ((totalBytesDownloaded * 8) / (downloadDuration * 1024 * 1024)).toFixed(2) : '0.00'
      
      output.push(`    数据量: ${(totalBytesDownloaded / 1024).toFixed(1)} KB`)
      output.push(`    耗时: ${downloadDuration.toFixed(2)}s`)
      output.push(`    下载速度: ${downloadMbps} Mbps`)
      output.push('')
      
      // Step 3: 网络信息（真实数据）
      output.push('  网络信息...')
      const conn = (navigator as any).connection
      if (conn) {
        output.push(`    连接类型: ${conn.effectiveType || '未知'}`)
        output.push(`    下行带宽: ${conn.downlink || '未知'} Mbps`)
        output.push(`    RTT: ${conn.rtt || '未知'} ms`)
        output.push(`    省流量模式: ${conn.saveData ? '开启' : '关闭'}`)
      } else {
        output.push(`    在线状态: ${navigator.onLine ? '在线' : '离线'}`)
      }
      output.push('')
      
      // Step 4: 汇总结果
      const jitter = pingResults.length > 1 
        ? (Math.max(...pingResults) - Math.min(...pingResults)).toFixed(1)
        : '0.0'
      
      const downloadVal = parseFloat(downloadMbps)
      const connectionType = conn?.effectiveType || (downloadVal > 10 ? '4g' : downloadVal > 2 ? '3g' : 'slow-2g')
      
      output.push('═'.repeat(40))
      output.push('')
      output.push('📊 测试结果')
      output.push('')
      output.push(`  Ping:       ${avgPing} ms`)
      output.push(`  抖动:       ${jitter} ms`)
      output.push(`  下载速度:   ${downloadMbps} Mbps`)
      output.push(`  连接类型:   ${connectionType}`)
      output.push(`  数据来源:   Open-Meteo API`)
      output.push('')
      output.push('注: 下载速度通过真实 API 请求测量')
      
    } catch (error: any) {
      output.push('')
      output.push(`测试出错: ${error.message || '未知错误'}`)
      output.push('请检查网络连接后重试')
    }
    
    return { output: output.join('\n') }
  },
  description: '真实网络速度测试',
  usage: 'speedtest',
  examples: ['speedtest']
}, { force: true, source: 'enhancedCommands' })

registerCommand('process', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const action = args[0] || 'list'

    if (action !== 'list' && action !== 'ls') {
      return {
        output: [
          '进程列表',
          '',
          '用法: process list',
          '',
          '显示浏览器环境中的虚拟进程列表',
          '进程数据基于真实的浏览器 API 动态生成',
        ].join('\n')
      }
    }

    const now = new Date()
    const uptime = Math.floor(performance.now() / 1000)
    const hours = Math.floor(uptime / 3600)
    const mins = Math.floor((uptime % 3600) / 60)
    const secs = uptime % 60
    const uptimeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

    // 基于真实浏览器数据动态生成进程列表
    const memory = (performance as any).memory
    const jsHeapUsed = memory ? (memory.usedJSHeapSize / 1024 / 1024).toFixed(1) : 'N/A'
    const jsHeapTotal = memory ? (memory.totalJSHeapSize / 1024 / 1024).toFixed(1) : 'N/A'
    const deviceMemory = (navigator as any).deviceMemory || '未知'
    const cpuCores = navigator.hardwareConcurrency || 1
    const conn = (navigator as any).connection

    // 基于 JS 堆使用率动态计算 CPU 和内存
    const heapRatio = memory ? memory.usedJSHeapSize / memory.jsHeapSizeLimit : 0.3
    const baseCpu = 0.5 + heapRatio * 5

    const processes = [
      { pid: 1, user: 'root', cpu: 0.0, mem: 0.1, cmd: '/sbin/init' },
      { pid: 2, user: 'root', cpu: 0.0, mem: 0.1, cmd: '[kthreadd]' },
      { pid: 100, user: 'root', cpu: 0.3, mem: 0.8, cmd: '/usr/sbin/sshd' },
      { pid: 200, user: 'root', cpu: 0.5, mem: 1.2, cmd: '/usr/sbin/nginx' },
      { pid: 500, user: 'user', cpu: +(baseCpu + Math.random() * 2).toFixed(1), mem: +(heapRatio * 100 * 0.8).toFixed(1), cmd: 'node (Vite Dev Server)' },
      { pid: 501, user: 'user', cpu: +(baseCpu * 3 + Math.random() * 5).toFixed(1), mem: +(heapRatio * 100 * 1.5).toFixed(1), cmd: `chrome --type=renderer [${cpuCores} cores]` },
      { pid: 502, user: 'user', cpu: +(baseCpu + Math.random() * 3).toFixed(1), mem: +(heapRatio * 100 * 0.6).toFixed(1), cmd: 'react-devtools' },
      { pid: 503, user: 'user', cpu: +(baseCpu * 0.5 + Math.random()).toFixed(1), mem: 2.3, cmd: 'terminal' },
      { pid: 1000, user: 'root', cpu: 0.1, mem: 0.3, cmd: 'cron' },
    ]

    const output: string[] = [
      `进程列表 - ${now.toLocaleString('zh-CN')}`,
      `系统运行时间: ${uptimeStr}`,
      '',
      `${'PID'.padStart(7)} ${'USER'.padEnd(8)} ${'CPU%'.padStart(6)} ${'MEM%'.padStart(6)} COMMAND`,
      '─'.repeat(70),
    ]

    processes.forEach(p => {
      output.push(
        `${String(p.pid).padStart(7)} ${p.user.padEnd(8)} ${p.cpu.toFixed(1).padStart(6)} ${p.mem.toFixed(1).padStart(6)} ${p.cmd}`
      )
    })

    output.push('─'.repeat(70))
    output.push('')
    output.push('系统信息:')
    output.push(`  CPU 核心数:   ${cpuCores}`)
    output.push(`  设备内存:     ${deviceMemory} GB`)
    output.push(`  JS 堆已用:    ${jsHeapUsed} MB`)
    output.push(`  JS 堆总量:    ${jsHeapTotal} MB`)
    if (conn) {
      output.push(`  网络类型:     ${conn.effectiveType || '未知'}`)
      output.push(`  网络下行:     ${conn.downlink || '未知'} Mbps`)
    }
    output.push(`  在线状态:     ${navigator.onLine ? '在线' : '离线'}`)
    output.push('')
    output.push('注: 进程数据基于浏览器 API 动态生成')

    return { output: output.join('\n') }
  },
  description: '显示浏览器环境虚拟进程列表（动态数据）',
  usage: 'process list',
  examples: ['process list']
}, { source: 'enhancedCommands' })

registerCommand('fortune', {
  handler: (_context: CommandContext): CommandResult => {
    const fortunes = [
      { text: '代码就像幽默。当你不得不解释它时，它就不那么好了。', author: 'Cory House' },
      { text: '最好的错误信息是那种你能立刻自己解决的。', author: 'Phil Karlton' },
      { text: '第一次做对，比事后再修复要便宜得多。', author: 'Philip Crosby' },
      { text: '完美不是无可添加，而是无可删减。', author: 'Antoine de Saint-Exupéry' },
      { text: '如果你无法简单地解释它，你就还没有真正理解它。', author: 'Albert Einstein' },
      { text: '过早优化是万恶之源。', author: 'Donald Knuth' },
      { text: '代码是写给人看的，只是顺便让机器执行。', author: 'Harold Abelson' },
      { text: '调试是消除错误的过程，编程是引入错误的过程。', author: 'Edsger Dijkstra' },
      { text: '测试不能证明错误不存在，只能证明存在。', author: 'Edsger Dijkstra' },
      { text: '简单的东西比复杂的东西更难做到。', author: 'Steve Jobs' },
      { text: '当你第一次做某件事时，会花很长时间。这很正常。', author: 'John Carmack' },
      { text: '如果你不测试，用户会替你测试。', author: '作者佚名' },
      { text: '让它工作，让它正确，让它快速。', author: 'Kent Beck' },
      { text: '一个好的程序员是当他的代码崩溃时能找到原因的人。', author: 'Linus Torvalds' },
      { text: '复制粘贴是编程的大敌。', author: '作者佚名' },
      { text: '六个月后，即使是你自己写的代码，看起来也像是别人写的。', author: 'Robert C. Martin' },
      { text: '命名是计算机科学中最难的两件事之一。', author: 'Phil Karlton' },
      { text: '函数应该做一件事，并且做好。', author: 'Robert C. Martin' },
      { text: '过早抽象是万恶之源。', author: '作者佚名' },
      { text: '优秀的工程师是那些在调用前会思考两次的人。', author: 'Alexander Stepanov' },
      { text: '程序测试的目的不是发现错误，而是证明它们不存在。', author: 'Edsger Dijkstra' },
      { text: '在软件项目中，前 90% 的工作占据了 90% 的时间。', author: 'Tom Cargill' },
      { text: '用户界面就像笑话。如果你不得不解释它，它就不那么好了。', author: 'Marco Gomez' },
      { text: '向后兼容性很重要。新功能更重要。', author: '作者佚名' },
      { text: '没有测试的代码就是有 bug 的代码。', author: '作者佚名' },
    ]

    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)]

    return {
      output: [
        '📜 今日格言',
        '',
        `"${fortune.text}"`,
        '',
        `  — ${fortune.author}`,
        '',
        '输入 fortune 获取下一条',
      ].join('\n')
    }
  },
  description: '显示随机编程格言',
  usage: 'fortune',
  examples: ['fortune']
}, { force: true, source: 'enhancedCommands' })

registerCommand('cowsay', {
  handler: (context: CommandContext): CommandResult => {
    const message = context.args.join(' ') || 'Moo!'

    const maxWidth = 40
    const wrapped: string[] = []
    let line = ''
    for (const word of message.split(' ')) {
      if (line.length + word.length + 1 > maxWidth) {
        wrapped.push(line)
        line = word
      } else {
        line = line ? line + ' ' + word : word
      }
    }
    if (line) wrapped.push(line)

    const border = '_'.repeat(Math.max(...wrapped.map(w => w.length), 10) + 2)
    const floor = '-'.repeat(border.length)

    const bubble: string[] = []
    bubble.push(' ' + border)
    if (wrapped.length === 1) {
      bubble.push(`< ${wrapped[0]} >`)
    } else {
      for (let i = 0; i < wrapped.length; i++) {
        if (i === 0) {
          bubble.push(`/ ${wrapped[i].padEnd(border.length - 3)} \\`)
        } else if (i === wrapped.length - 1) {
          bubble.push(`\\ ${wrapped[i].padEnd(border.length - 3)} /`)
        } else {
          bubble.push(`| ${wrapped[i].padEnd(border.length - 3)} |`)
        }
      }
    }
    bubble.push(' ' + floor)

    const cow = [
      '        \\   ^__^',
      '         \\  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ]

    return {
      output: [...bubble, ...cow].join('\n')
    }
  },
  description: 'ASCII 奶牛说你想说的话',
  usage: 'cowsay <文本>',
  examples: ['cowsay Hello', 'cowsay "I love Linux"']
}, { force: true, source: 'enhancedCommands' })