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