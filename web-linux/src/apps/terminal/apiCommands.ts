import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithCache, fetchWithRetry, formatNumber } from '../../utils/apiCache'

const cityMap: Record<string, { lat: number; lon: number; name: string }> = {
  'beijing': { lat: 39.9042, lon: 116.4074, name: '北京' },
  '北京': { lat: 39.9042, lon: 116.4074, name: '北京' },
  'shanghai': { lat: 31.2304, lon: 121.4737, name: '上海' },
  '上海': { lat: 31.2304, lon: 121.4737, name: '上海' },
  'shenzhen': { lat: 22.5431, lon: 114.0579, name: '深圳' },
  '深圳': { lat: 22.5431, lon: 114.0579, name: '深圳' },
  'guangzhou': { lat: 23.1291, lon: 113.2644, name: '广州' },
  '广州': { lat: 23.1291, lon: 113.2644, name: '广州' },
  'tokyo': { lat: 35.6762, lon: 139.6503, name: '东京' },
  'new york': { lat: 40.7128, lon: -74.006, name: '纽约' },
  'london': { lat: 51.5074, lon: -0.1278, name: '伦敦' },
  'paris': { lat: 48.8566, lon: 2.3522, name: '巴黎' },
  'chengdu': { lat: 30.5728, lon: 104.0668, name: '成都' },
  '成都': { lat: 30.5728, lon: 104.0668, name: '成都' },
  'hangzhou': { lat: 30.2741, lon: 120.1551, name: '杭州' },
  '杭州': { lat: 30.2741, lon: 120.1551, name: '杭州' },
  'wuhan': { lat: 30.5928, lon: 114.3055, name: '武汉' },
  '武汉': { lat: 30.5928, lon: 114.3055, name: '武汉' },
  'xian': { lat: 34.3416, lon: 108.9398, name: '西安' },
  '西安': { lat: 34.3416, lon: 108.9398, name: '西安' },
  'nanjing': { lat: 32.0603, lon: 118.7969, name: '南京' },
  '南京': { lat: 32.0603, lon: 118.7969, name: '南京' },
  'sydney': { lat: -33.8688, lon: 151.2093, name: '悉尼' },
  'dubai': { lat: 25.2048, lon: 55.2708, name: '迪拜' },
  'singapore': { lat: 1.3521, lon: 103.8198, name: '新加坡' },
  'seoul': { lat: 37.5665, lon: 126.978, name: '首尔' },
  'bangkok': { lat: 13.7563, lon: 100.5018, name: '曼谷' },
}

const weatherDescriptions: Record<number, string> = {
  0: '☀️ 晴朗', 1: '🌤️ 晴间多云', 2: '⛅ 局部多云', 3: '☁️ 阴天',
  45: '🌫️ 雾', 48: '🌫️ 雾凇', 51: '🌦️ 毛毛雨', 53: '🌦️ 毛毛雨',
  55: '🌧️ 密集毛毛雨', 56: '🌨️ 冻毛毛雨', 57: '🌨️ 冻毛毛雨',
  61: '🌧️ 小雨', 63: '🌧️ 中雨', 65: '🌧️ 大雨',
  66: '🌨️ 冻雨', 67: '🌨️ 冻雨', 71: '🌨️ 小雪',
  73: '🌨️ 中雪', 75: '🌨️ 大雪', 77: '❄️ 雪粒',
  80: '🌧️ 阵雨', 81: '🌧️ 中阵雨', 82: '🌧️ 强阵雨',
  85: '🌨️ 阵雪', 86: '🌨️ 强阵雪',
  95: '⛈️ 雷暴', 96: '⛈️ 雷暴伴冰雹', 99: '⛈️ 强雷暴伴冰雹',
}

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    const cityKey = city.toLowerCase()
    const cityInfo = cityMap[cityKey] || { lat: 39.9042, lon: 116.4074, name: city }
    
    try {
      const data = await fetchWithCache(
        `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&timezone=auto&forecast_days=3`,
        { mode: 'cors' },
        10 * 60 * 1000
      ) as Record<string, unknown>
      
      const current = data.current as Record<string, unknown>
      const daily = data.daily as Record<string, unknown[]>
      
      const desc = weatherDescriptions[current.weather_code as number] || '❓ 未知'
      
      const output: string[] = []
      output.push(`📍 ${cityInfo.name} 天气预报`)
      output.push('═'.repeat(40))
      output.push('')
      output.push('【当前天气】')
      output.push(`  ${desc}`)
      output.push(`  🌡️ 温度: ${current.temperature_2m}°C (体感 ${current.apparent_temperature}°C)`)
      output.push(`  💧 湿度: ${current.relative_humidity_2m}%`)
      output.push(`  💨 风速: ${current.wind_speed_10m} km/h`)
      output.push(`  🌡️ 气压: ${current.pressure_msl} hPa`)
      output.push('')
      output.push('【未来三天预报】')
      
      const times = daily.time as string[]
      const maxTemps = daily.temperature_2m_max as number[]
      const minTemps = daily.temperature_2m_min as number[]
      const weatherCodes = daily.weather_code as number[]
      const sunrises = daily.sunrise as string[]
      const sunsets = daily.sunset as string[]
      
      for (let i = 0; i < Math.min(3, times.length); i++) {
        const date = times[i]
        const maxTemp = maxTemps[i]
        const minTemp = minTemps[i]
        const dayDesc = weatherDescriptions[weatherCodes[i]] || '❓'
        output.push(`  ${date}: ${dayDesc} ${minTemp}°C ~ ${maxTemp}°C`)
      }
      
      output.push('')
      output.push(`  🌅 日出: ${sunrises[0]?.split('T')[1] || '--:--'}`)
      output.push(`  🌇 日落: ${sunsets[0]?.split('T')[1] || '--:--'}`)
      output.push('')
      output.push('数据来源: Open-Meteo (已缓存10分钟)')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取天气信息失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '获取实时天气信息',
  usage: 'weather [城市]',
  examples: ['weather', 'weather Beijing', 'weather 上海', 'weather tokyo']
})

registerCommand('crypto', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithRetry(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h',
        { mode: 'cors' }
      ) as Array<Record<string, unknown>>
      
      const output: string[] = []
      
      output.push('💰 加密货币行情 (前10名)')
      output.push('═'.repeat(60))
      output.push('')
      output.push('排名  名称           价格(USD)    24h涨跌   市值')
      output.push('─'.repeat(60))
      
      data.forEach((coin, index) => {
        const rank = ((coin.market_cap_rank as number) || index + 1).toString().padEnd(4)
        const name = `${coin.name} (${(coin.symbol as string).toUpperCase()})`.padEnd(15)
        const price = `$${(coin.current_price as number).toLocaleString(undefined, { maximumFractionDigits: 2 })}`.padStart(12)
        const change = coin.price_change_percentage_24h as number
        const changeStr = (change >= 0 ? '+' : '') + change.toFixed(2) + '%'
        const paddedChange = changeStr.padStart(9)
        const mcap = `$${formatNumber(coin.market_cap as number, 2)}`.padStart(10)
        
        output.push(`${rank} ${name} ${price} ${paddedChange}  ${mcap}`)
      })
      
      output.push('')
      output.push('数据来源: CoinGecko')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取加密货币行情失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '获取加密货币实时行情',
  usage: 'crypto',
  examples: ['crypto']
})

registerCommand('news', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ') || 'technology'
    
    try {
      const data = await fetchWithCache(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`,
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Record<string, unknown[]>
      
      const output: string[] = []
      
      output.push(`📰 Hacker News 热门 - "${query}"`)
      output.push('═'.repeat(60))
      output.push('')
      
      const hits = data.hits as Array<Record<string, unknown>>
      hits.forEach((hit, index) => {
        const num = (index + 1).toString().padStart(2)
        output.push(`${num}. ${hit.title}`)
        output.push(`   ⬆️ ${hit.points || 0} points | 💬 ${hit.num_comments || 0} comments | 👤 ${hit.author || 'unknown'}`)
        if (hit.url) {
          output.push(`   🔗 ${hit.url}`)
        }
        output.push('')
      })
      
      output.push('数据来源: Hacker News (Algolia API) (已缓存5分钟)')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取新闻失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '获取Hacker News热门新闻',
  usage: 'news [关键词]',
  examples: ['news', 'news javascript', 'news AI']
})

const fallbackJokes = [
  { setup: '为什么程序员总是分不清万圣节和圣诞节？', punchline: '因为 Oct 31 = Dec 25' },
  { setup: '程序员最讨厌的季节是什么？', punchline: '秋天，因为要处理太多 Fall' },
  { setup: '为什么程序员喜欢黑暗模式？', punchline: '因为 Light 会吸引 bugs' },
  { setup: 'SQL查询走进酒吧，看到两张表...', punchline: '他走过去问："我可以 JOIN 你们吗？"' },
  { setup: '为什么程序员总是很穷？', punchline: '因为他们把所有的 cache 都清空了' },
  { setup: '为什么Java开发者戴眼镜？', punchline: '因为他们看不到 C#' },
  { setup: '一个程序员的妻子让他去买面包，说："如果有鸡蛋，买一打。"', punchline: '他买了12个面包回来' },
  { setup: '为什么程序员总是把万圣节和圣诞节搞混？', punchline: '因为 Oct 31 == Dec 25' },
]

registerCommand('joke', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://official-joke-api.appspot.com/random_joke',
        { mode: 'cors' },
        0
      ) as Record<string, string>
      
      return {
        output: [
          '😂 随机笑话',
          '═'.repeat(40),
          '',
          `Q: ${data.setup}`,
          '',
          `A: ${data.punchline}`,
          '',
        ].join('\n')
      }
    } catch {
      const joke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)]
      return {
        output: [
          '😂 随机笑话',
          '═'.repeat(40),
          '',
          `Q: ${joke.setup}`,
          '',
          `A: ${joke.punchline}`,
          '',
          '提示: 在线API不可用，显示本地笑话库',
        ].join('\n')
      }
    }
  },
  description: '获取随机笑话',
  usage: 'joke',
  examples: ['joke']
})

const langMap: Record<string, string> = {
  'en': 'en', 'zh': 'zh-CN', 'ja': 'ja', 'ko': 'ko',
  'fr': 'fr', 'de': 'de', 'es': 'es', 'ru': 'ru',
  'pt': 'pt', 'it': 'it', 'ar': 'ar', 'hi': 'hi',
}

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '用法: translate <目标语言> <文本>',
          '',
          '支持的语言: en(英语), zh(中文), ja(日语), ko(韩语),',
          '           fr(法语), de(德语), es(西班牙语), ru(俄语),',
          '           pt(葡语), it(意语), ar(阿语), hi(印地语)',
          '',
          '示例:',
          '  translate en 你好世界',
          '  translate zh Hello World',
          '  translate ja 早上好',
        ].join('\n')
      }
    }
    
    const targetLang = args[0]
    const text = args.slice(1).join(' ')
    
    const target = langMap[targetLang] || targetLang
    
    try {
      const data = await fetchWithRetry(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${target}`,
        { mode: 'cors' }
      ) as Record<string, Record<string, string>>
      
      const translated = data.responseData?.translatedText
      
      if (!translated) throw new Error('翻译结果为空')
      
      return {
        output: [
          '🌐 翻译结果',
          '═'.repeat(40),
          '',
          `原文: ${text}`,
          '',
          `译文: ${translated}`,
          '',
          '数据来源: MyMemory Translation API',
        ].join('\n')
      }
    } catch {
      return {
        output: [
          '⚠️ 翻译服务暂时不可用',
          '',
          `原文: ${text}`,
          `目标语言: ${targetLang}`,
          '',
          '提示: 请检查网络连接后重试',
        ].join('\n')
      }
    }
  },
  description: '翻译文本（支持多语言）',
  usage: 'translate <目标语言> <文本>',
  examples: ['translate en 你好', 'translate zh Hello World', 'translate ja 早上好']
})

registerCommand('qr', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: qr <文本或链接>\n生成二维码的文本描述' }
    }
    
    const text = args.join(' ')
    
    return {
      output: [
        '📱 二维码生成',
        '═'.repeat(40),
        '',
        `内容: ${text}`,
        '',
        '二维码图片已生成 (在QR码生成器应用中查看)',
        `在线查看: https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`,
        '',
      ].join('\n')
    }
  },
  description: '生成二维码信息',
  usage: 'qr <文本>',
  examples: ['qr https://example.com', 'qr Hello World']
})

const dnsTypeMap: Record<number, string> = { 
  1: 'A', 2: 'NS', 5: 'CNAME', 15: 'MX', 
  16: 'TXT', 28: 'AAAA', 6: 'SOA', 12: 'PTR',
  33: 'SRV', 48: 'DNSKEY', 43: 'DS'
}

registerCommand('dns', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { 
        output: [
          '用法: dns <域名> [类型]',
          '',
          '查询域名DNS信息',
          '支持的类型: A, AAAA, NS, MX, TXT, CNAME, SOA',
          '',
          '示例:',
          '  dns google.com',
          '  dns github.com MX',
          '  dns cloudflare.com TXT',
        ].join('\n')
      }
    }
    
    const domain = args[0]
    const type = (args[1] || 'A').toUpperCase()
    
    try {
      const data = await fetchWithCache(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Record<string, unknown>
      
      const output: string[] = []
      output.push(`🌐 DNS 查询: ${domain} (${type})`)
      output.push('═'.repeat(50))
      output.push('')
      
      const answers = data.Answer as Array<Record<string, unknown>> | undefined
      if (answers && answers.length > 0) {
        output.push('【DNS记录】')
        answers.forEach((record) => {
          const recType = dnsTypeMap[record.type as number] || `TYPE${record.type}`
          output.push(`  ${recType.padEnd(8)} ${(record.data as string).padEnd(35)} TTL: ${record.TTL}s`)
        })
      } else {
        output.push('  未找到DNS记录')
      }
      
      const comment = data.Comment as string | undefined
      if (comment) {
        output.push('')
        output.push(`备注: ${comment}`)
      }
      
      output.push('')
      output.push('数据来源: Google DNS (已缓存5分钟)')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `DNS查询失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '查询域名DNS信息',
  usage: 'dns <域名> [类型]',
  examples: ['dns google.com', 'dns github.com MX', 'dns cloudflare.com TXT']
})

registerCommand('ip', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithRetry(
        'https://ipapi.co/json/',
        { mode: 'cors' }
      ) as Record<string, unknown>
      
      const output: string[] = []
      output.push('🌐 IP 信息查询')
      output.push('═'.repeat(40))
      output.push('')
      output.push(`  IP地址: ${data.ip}`)
      output.push(`  版本: ${data.version}`)
      output.push(`  城市: ${data.city}`)
      output.push(`  地区: ${data.region}`)
      output.push(`  国家: ${data.country_name} (${data.country_code})`)
      output.push(`  邮编: ${data.postal || 'N/A'}`)
      output.push(`  纬度: ${data.latitude}`)
      output.push(`  经度: ${data.longitude}`)
      output.push(`  时区: ${data.timezone}`)
      output.push(`  运营商: ${data.org || 'N/A'}`)
      output.push(`  ASN: ${data.asn || 'N/A'}`)
      output.push('')
      output.push('数据来源: ipapi.co')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `IP查询失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '获取当前IP地址和位置信息',
  usage: 'ip',
  examples: ['ip']
})

registerCommand('dict', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: dict <单词>\n查询英文单词释义' }
    }
    
    const word = args.join(' ')
    
    try {
      const data = await fetchWithCache(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { mode: 'cors' },
        30 * 60 * 1000
      ) as Array<Record<string, unknown>>
      
      if (!data || data.length === 0) {
        return { output: `未找到单词 "${word}" 的释义` }
      }
      
      const entry = data[0]
      const output: string[] = []
      
      output.push(`📖 词典: ${entry.word}`)
      output.push('═'.repeat(50))
      output.push('')
      
      const phonetics = entry.phonetics as Array<Record<string, string>> | undefined
      if (phonetics && phonetics.length > 0) {
        const phonetic = phonetics.find(p => p.text) || phonetics[0]
        output.push(`  音标: ${phonetic.text || 'N/A'}`)
        output.push('')
      }
      
      const meanings = entry.meanings as Array<Record<string, unknown>> | undefined
      if (meanings) {
        meanings.forEach((meaning) => {
          const partOfSpeech = meaning.partOfSpeech as string
          output.push(`【${partOfSpeech}】`)
          
          const definitions = meaning.definitions as Array<Record<string, string>>
          if (definitions) {
            definitions.slice(0, 3).forEach((def, idx) => {
              output.push(`  ${idx + 1}. ${def.definition}`)
              if (def.example) {
                output.push(`     例: ${def.example}`)
              }
            })
          }
          output.push('')
        })
      }
      
      output.push('数据来源: Dictionary API (已缓存30分钟)')
      
      return { output: output.join('\n') }
    } catch {
      return { output: `查询失败: 无法找到 "${word}" 的释义，请检查拼写或稍后重试` }
    }
  },
  description: '查询英文单词释义',
  usage: 'dict <单词>',
  examples: ['dict hello', 'dict computer', 'dict algorithm']
})
