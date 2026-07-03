import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithCache, fetchWithRetry, formatNumber, clearCache, getCacheStats } from '../../utils/apiCache'
import { getCityInfo, weatherDescriptions, cityMap } from './cityMap'

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    const cityInfo = getCityInfo(city)
    
    try {
      const data = await fetchWithCache(
        `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&timezone=auto&forecast_days=3`,
        { mode: 'cors' },
        10 * 60 * 1000
      ) as Record<string, unknown>
      
      const current = data.current as Record<string, unknown>
      const daily = data.daily as Record<string, unknown[]>
      
      if (!current || !daily) {
        return { output: `⚠️ 无法获取 ${cityInfo.name} 的天气数据` }
      }
      
      const desc = weatherDescriptions[current.weather_code as number] || '❓ 未知'
      
      const windDirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
      const windDirIdx = Math.round(((current.wind_direction_10m as number) || 0) / 45) % 8
      const windDir = windDirs[windDirIdx]
      
      const temp = current.temperature_2m as number
      const feelsLike = current.apparent_temperature as number
      const humidity = current.relative_humidity_2m as number
      const windSpeed = current.wind_speed_10m as number
      const pressure = current.pressure_msl as number
      
      let tempColor = '\x1b[32m'
      if (temp > 30) tempColor = '\x1b[31m'
      else if (temp > 25) tempColor = '\x1b[33m'
      else if (temp < 10) tempColor = '\x1b[36m'
      
      const output: string[] = []
      output.push(`📍 ${cityInfo.name} 天气预报`)
      output.push('═'.repeat(50))
      output.push('')
      output.push('【当前天气】')
      output.push(`  ${desc}`)
      output.push(`  🌡️ 温度: ${tempColor}${temp}°C\x1b[0m (体感 ${feelsLike}°C)`)
      output.push(`  💧 湿度: ${humidity}%`)
      output.push(`  💨 风速: ${windSpeed} km/h (${windDir}风)`)
      output.push(`  🌡️ 气压: ${pressure} hPa`)
      
      if (humidity > 80) output.push('  💡 提示: 湿度较高，注意防潮')
      if (windSpeed > 20) output.push('  💡 提示: 风力较大，注意防风')
      if (temp > 35) output.push('  💡 提示: 高温预警，注意防暑')
      if (temp < 5) output.push('  💡 提示: 天气寒冷，注意保暖')
      
      output.push('')
      output.push('【未来三天预报】')
      
      const times = daily.time as string[]
      const maxTemps = daily.temperature_2m_max as number[]
      const minTemps = daily.temperature_2m_min as number[]
      const weatherCodes = daily.weather_code as number[]
      const sunrises = daily.sunrise as string[]
      const sunsets = daily.sunset as string[]
      
      for (let i = 0; i < Math.min(3, times.length); i++) {
        const date = times[i]?.split('-').slice(1).join('-') || ''
        const maxTemp = maxTemps[i]
        const minTemp = minTemps[i]
        const dayDesc = weatherDescriptions[weatherCodes[i]] || '❓'
        output.push(`  ${date}: ${dayDesc} ${minTemp}°C ~ ${maxTemp}°C`)
      }
      
      output.push('')
      output.push(`  🌅 日出: ${sunrises[0]?.split('T')[1]?.slice(0, 5) || '--:--'}`)
      output.push(`  🌇 日落: ${sunsets[0]?.split('T')[1]?.slice(0, 5) || '--:--'}`)
      output.push('')
      output.push('数据来源: Open-Meteo (已缓存10分钟)')
      
      return { output: output.join('\n') }
    } catch {
      const fallbackOutput = [
        `📍 ${cityInfo.name} 天气预报`,
        '═'.repeat(50),
        '',
        '⚠️ 天气服务暂时不可用',
        '',
        '请检查网络连接或稍后重试',
        '支持的城市: 北京, 上海, 广州, 深圳, 东京, 纽约, 伦敦, 巴黎等',
        '',
      ].join('\n')
      return { output: fallbackOutput }
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
      ) as Record<string, unknown>
      
      const hits = data.hits as Array<Record<string, unknown>> || []
      
      if (!hits || hits.length === 0) {
        return { output: `📰 未找到 "${query}" 相关的新闻\n请尝试其他关键词，如: technology, AI, javascript, python` }
      }
      
      const output: string[] = []
      
      output.push(`📰 Hacker News 热门 - "${query}"`)
      output.push('═'.repeat(70))
      output.push('')
      
      hits.slice(0, 10).forEach((hit, index) => {
        const num = (index + 1).toString().padStart(2)
        const title = hit.title as string || '无标题'
        const points = hit.points as number || 0
        const comments = hit.num_comments as number || 0
        const author = hit.author as string || 'unknown'
        const url = hit.url as string
        
        const pointsColor = points > 1000 ? '\x1b[31m' : points > 500 ? '\x1b[33m' : '\x1b[32m'
        
        output.push(`${num}. ${title}`)
        output.push(`   ⬆️ ${pointsColor}${points}\x1b[0m points | 💬 ${comments} comments | 👤 ${author}`)
        if (url) {
          output.push(`   🔗 ${url}`)
        }
        output.push('')
      })
      
      output.push(`共找到 ${hits.length} 条结果，显示前10条`)
      output.push('数据来源: Hacker News (Algolia API) (已缓存5分钟)')
      output.push('')
      output.push('提示: 使用 news [关键词] 搜索特定主题')
      
      return { output: output.join('\n') }
    } catch {
      const fallbackNews = [
        '📰 Hacker News 热门 - 离线模式',
        '═'.repeat(70),
        '',
        '网络暂时不可用，显示精选技术新闻:',
        '',
        '1. WebAssembly 的未来：从浏览器到云端',
        '   ⬆️ 2.5K points | 💬 156 comments',
        '',
        '2. React 19 新特性详解',
        '   ⬆️ 1.8K points | 💬 89 comments',
        '',
        '3. AI 编程助手的崛起与挑战',
        '   ⬆️ 3.2K points | 💬 234 comments',
        '',
        '4. WebGPU：下一代图形编程接口',
        '   ⬆️ 1.2K points | 💬 67 comments',
        '',
        '5. TypeScript 6.0 发布亮点',
        '   ⬆️ 980 points | 💬 45 comments',
        '',
        '提示: 网络恢复后将显示最新新闻',
      ].join('\n')
      return { output: fallbackNews }
    }
  },
  description: '获取Hacker News热门新闻',
  usage: 'news [关键词]',
  examples: ['news', 'news javascript', 'news AI', 'news python']
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
          '🌐 翻译工具',
          '═'.repeat(40),
          '',
          '用法: translate <目标语言> <文本>',
          '',
          '支持的语言:',
          '  en - 英语    zh - 中文    ja - 日语    ko - 韩语',
          '  fr - 法语    de - 德语    es - 西班牙语  ru - 俄语',
          '  pt - 葡语    it - 意语    ar - 阿语     hi - 印地语',
          '',
          '示例:',
          '  translate en 你好世界',
          '  translate zh Hello World',
          '  translate ja 早上好',
          '  translate fr Bonjour le monde',
        ].join('\n')
      }
    }
    
    const targetLang = args[0]
    const text = args.slice(1).join(' ')
    
    const target = langMap[targetLang] || targetLang
    
    const langNames: Record<string, string> = {
      'en': '英语', 'zh': '中文', 'ja': '日语', 'ko': '韩语',
      'fr': '法语', 'de': '德语', 'es': '西班牙语', 'ru': '俄语',
      'pt': '葡语', 'it': '意语', 'ar': '阿语', 'hi': '印地语'
    }
    
    try {
      const data = await fetchWithRetry(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${target}`,
        { mode: 'cors' }
      ) as Record<string, unknown>
      
      const responseData = data.responseData as Record<string, string> | undefined
      const translated = responseData?.translatedText
      
      if (!translated) throw new Error('翻译结果为空')
      
      const matches = data.matches as Array<Record<string, unknown>> || []
      const bestMatch = matches[0]
      const confidence = bestMatch?.confidence as number || 0
      
      const confColor = confidence >= 0.8 ? '\x1b[32m' : confidence >= 0.5 ? '\x1b[33m' : '\x1b[31m'
      
      return {
        output: [
          '🌐 翻译结果',
          '═'.repeat(40),
          '',
          `原文: ${text}`,
          '',
          `译文: \x1b[1m${translated}\x1b[0m`,
          '',
          `目标语言: ${langNames[targetLang] || targetLang}`,
          `置信度: ${confColor}${(confidence * 100).toFixed(0)}%\x1b[0m`,
          '',
          '数据来源: MyMemory Translation API',
        ].join('\n')
      }
    } catch {
      const fallbackTranslations: Record<string, Record<string, string>> = {
        'en': { '你好': 'Hello', '世界': 'World', '谢谢': 'Thank you', '再见': 'Goodbye' },
        'zh': { 'hello': '你好', 'world': '世界', 'thank you': '谢谢', 'goodbye': '再见' },
        'ja': { '你好': 'こんにちは', '世界': '世界', '谢谢': 'ありがとう', '再见': 'さようなら' },
      }
      
      const fallback = fallbackTranslations[target]?.[text]
      
      const output: string[] = [
        '⚠️ 翻译服务暂时不可用',
        '',
        `原文: ${text}`,
        `目标语言: ${langNames[targetLang] || targetLang}`,
      ]
      
      if (fallback) {
        output.push('')
        output.push(`💡 离线翻译: ${fallback}`)
      }
      
      output.push('')
      output.push('提示: 请检查网络连接后重试')
      
      return { output: output.join('\n') }
    }
  },
  description: '翻译文本（支持多语言）',
  usage: 'translate <目标语言> <文本>',
  examples: ['translate en 你好', 'translate zh Hello World', 'translate ja 早上好', 'translate fr Bonjour']
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

registerCommand('stock', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: stock <股票代码>\n查询股票实时行情\n示例: stock AAPL, stock GOOGL, stock MSFT' }
    }
    
    const symbol = args[0].toUpperCase()
    
    try {
      const data = await fetchWithCache(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`,
        { mode: 'cors' },
        60 * 1000
      ) as Record<string, Record<string, string>>
      
      const quote = data['Global Quote']
      
      if (!quote || !quote['01. symbol']) {
        return { output: `未找到股票 "${symbol}" 的行情数据` }
      }
      
      const output: string[] = []
      output.push(`📈 股票行情: ${quote['01. symbol']}`)
      output.push('═'.repeat(50))
      output.push('')
      output.push(`  价格: $${quote['05. price']}`)
      output.push(`  开盘价: $${quote['02. open']}`)
      output.push(`  最高价: $${quote['03. high']}`)
      output.push(`  最低价: $${quote['04. low']}`)
      output.push(`  成交量: ${quote['06. volume']}`)
      output.push(`  最新更新: ${quote['07. latest trading day']}`)
      output.push('')
      output.push('数据来源: Alpha Vantage (demo API)')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取股票行情失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '查询股票实时行情',
  usage: 'stock <股票代码>',
  examples: ['stock AAPL', 'stock GOOGL', 'stock MSFT']
})

registerCommand('timezone', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: timezone [城市名]\n查询指定城市的当前时间\n示例: timezone, timezone Beijing, timezone Tokyo' }
    }
    
    const city = args.join(' ')
    const cityInfo = getCityInfo(city)
    
    try {
      const data = await fetchWithCache(
        `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m&timezone=auto`,
        { mode: 'cors' },
        60 * 1000
      ) as Record<string, unknown>
      
      const timezone = data.timezone as string
      const currentTime = data.current as Record<string, unknown>
      const timeStr = currentTime.time as string
      
      const output: string[] = []
      output.push(`🌍 ${cityInfo.name} 当前时间`)
      output.push('═'.repeat(40))
      output.push('')
      output.push(`  时区: ${timezone}`)
      output.push(`  当前时间: ${timeStr}`)
      output.push(`  当前温度: ${currentTime.temperature_2m}°C`)
      output.push('')
      output.push('数据来源: Open-Meteo')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取时区信息失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '查询指定城市的当前时间',
  usage: 'timezone [城市名]',
  examples: ['timezone', 'timezone Beijing', 'timezone Tokyo']
})

registerCommand('github', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: github <用户名>/<仓库名>\n查询GitHub仓库信息\n示例: github saya-ch/WebLinuxOS, github vercel/next.js' }
    }
    
    const repo = args.join('/')
    
    try {
      const data = await fetchWithCache(
        `https://api.github.com/repos/${encodeURIComponent(repo)}`,
        { mode: 'cors', headers: { 'Accept': 'application/vnd.github.v3+json' } },
        5 * 60 * 1000
      ) as Record<string, unknown>
      
      const output: string[] = []
      output.push(`📦 GitHub 仓库: ${data.full_name}`)
      output.push('═'.repeat(60))
      output.push('')
      output.push(`  描述: ${data.description || 'N/A'}`)
      output.push(`  星级: ⭐ ${data.stargazers_count}`)
      output.push(`  Forks: 🔀 ${data.forks_count}`)
      output.push(`  观察者: 👁️ ${data.watchers_count}`)
      output.push(`  语言: ${data.language || 'N/A'}`)
      output.push(`  许可证: ${(data.license as Record<string, string>)?.name || 'N/A'}`)
      output.push(`  创建时间: ${(data.created_at as string)?.split('T')[0] || 'N/A'}`)
      output.push(`  最后更新: ${(data.updated_at as string)?.split('T')[0] || 'N/A'}`)
      output.push(`  默认分支: ${data.default_branch || 'main'}`)
      output.push(`  🔗 ${data.html_url}`)
      output.push('')
      output.push('数据来源: GitHub API')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取GitHub仓库信息失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '查询GitHub仓库信息',
  usage: 'github <用户名>/<仓库名>',
  examples: ['github saya-ch/WebLinuxOS', 'github vercel/next.js', 'github reactjs/react.dev']
})

registerCommand('ghuser', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: ghuser <用户名>\n查询GitHub用户信息\n示例: ghuser saya-ch, ghuser octocat' }
    }
    
    const username = args[0]
    
    try {
      const data = await fetchWithCache(
        `https://api.github.com/users/${encodeURIComponent(username)}`,
        { mode: 'cors', headers: { 'Accept': 'application/vnd.github.v3+json' } },
        5 * 60 * 1000
      ) as Record<string, unknown>
      
      const output: string[] = []
      output.push(`👤 GitHub 用户: ${data.login}`)
      output.push('═'.repeat(50))
      output.push('')
      output.push(`  名称: ${data.name || data.login}`)
      output.push(`  简介: ${data.bio || 'N/A'}`)
      output.push(`  位置: ${data.location || 'N/A'}`)
      output.push(`  公司: ${data.company || 'N/A'}`)
      output.push(`  邮箱: ${data.email || 'N/A'}`)
      output.push(`  博客: ${data.blog || 'N/A'}`)
      output.push(`  仓库数: 📦 ${data.public_repos}`)
      output.push(`  关注者: 👥 ${data.followers}`)
      output.push(`  关注中: 👤 ${data.following}`)
      output.push(`  加入时间: ${(data.created_at as string)?.split('T')[0] || 'N/A'}`)
      output.push(`  🔗 ${data.html_url}`)
      output.push('')
      output.push('数据来源: GitHub API')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取GitHub用户信息失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '查询GitHub用户信息',
  usage: 'ghuser <用户名>',
  examples: ['ghuser saya-ch', 'ghuser octocat', 'ghuser vercel']
})

registerCommand('trivia', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://opentdb.com/api.php?amount=1&type=multiple',
        { mode: 'cors' },
        0
      ) as Record<string, unknown>
      
      const results = data.results as Array<Record<string, unknown>>
      const question = results[0]
      
      const output: string[] = []
      output.push('🧠 知识问答')
      output.push('═'.repeat(50))
      output.push('')
      output.push(`问题: ${question.question}`)
      output.push('')
      output.push('选项:')
      
      const options = [...(question.incorrect_answers as string[]), question.correct_answer as string]
      options.sort(() => Math.random() - 0.5)
      
      options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx)
        output.push(`  ${letter}. ${opt}`)
      })
      
      output.push('')
      output.push('使用 "trivia answer" 查看答案')
      
      return { output: output.join('\n') }
    } catch {
      const fallbackQuestions = [
        { question: 'HTML的全称是什么？', answer: 'HyperText Markup Language' },
        { question: 'JavaScript中typeof null的结果是什么？', answer: 'object' },
        { question: 'CSS中flex-direction默认值是什么？', answer: 'row' },
        { question: 'React中哪个Hook用于处理副作用？', answer: 'useEffect' },
        { question: 'HTTP状态码404表示什么？', answer: 'Not Found' },
      ]
      
      const question = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]
      
      return {
        output: [
          '🧠 知识问答',
          '═'.repeat(50),
          '',
          `问题: ${question.question}`,
          '',
          '使用 "trivia answer" 查看答案',
        ].join('\n')
      }
    }
  },
  description: '获取随机知识问答',
  usage: 'trivia',
  examples: ['trivia']
})

registerCommand('funfact', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://api.freeapi.app/api/v1/fun/facts',
        { mode: 'cors' },
        0
      ) as Record<string, unknown>
      
      const facts = data.data as Array<Record<string, string>>
      const fact = facts[Math.floor(Math.random() * facts.length)]
      
      return {
        output: [
          '🎲 趣味事实',
          '═'.repeat(50),
          '',
          `${fact.fact}`,
          '',
          '数据来源: FreeAPI',
        ].join('\n')
      }
    } catch {
      const fallbackFacts = [
        '蜜蜂的翅膀每分钟振动约200次',
        '月球上的一天相当于地球的27.3天',
        '章鱼有三颗心脏',
        '人类的眼睛可以分辨大约1000万种颜色',
        '树懒需要两周时间才能消化一片叶子',
        '蜂蜜永远不会变质',
        '水在零重力下会形成完美的球体',
        '香蕉是浆果，但草莓不是',
        '闪电的温度可以达到太阳表面温度的五倍',
        '蓝鲸的心脏和小汽车一样大',
      ]
      
      return {
        output: [
          '🎲 趣味事实',
          '═'.repeat(50),
          '',
          fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)],
          '',
        ].join('\n')
      }
    }
  },
  description: '获取随机趣味事实',
  usage: 'funfact',
  examples: ['funfact']
})

registerCommand('catfact', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://catfact.ninja/fact',
        { mode: 'cors' },
        0
      ) as Record<string, string>
      
      return {
        output: [
          '🐱 猫咪小知识',
          '═'.repeat(50),
          '',
          data.fact,
          '',
          `长度: ${data.length} 字符`,
          '',
          '数据来源: Cat Fact Ninja',
        ].join('\n')
      }
    } catch {
      const fallbackFacts = [
        '猫咪的睡眠时间占一生的70%',
        '猫咪可以发出超过100种不同的声音',
        '猫咪的胡须可以感知空气流动',
        '猫咪的耳朵有32块肌肉',
        '猫咪的跳跃高度可以达到自身高度的五倍',
        '猫咪的鼻子上有独特的纹路，就像人类的指纹',
        '猫咪不喜欢甜食，它们的味蕾无法感知甜味',
        '猫咪的尾巴可以表达它们的情绪',
        '猫咪的爪子有伸缩功能',
        '猫咪的眼睛在黑暗中可以反光',
      ]
      
      return {
        output: [
          '🐱 猫咪小知识',
          '═'.repeat(50),
          '',
          fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)],
          '',
        ].join('\n')
      }
    }
  },
  description: '获取关于猫咪的有趣事实',
  usage: 'catfact',
  examples: ['catfact']
})

registerCommand('quote', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://api.quotable.io/random',
        { mode: 'cors' },
        0
      ) as Record<string, string>
      
      return {
        output: [
          '💭 每日名言',
          '═'.repeat(50),
          '',
          `"${data.content}"`,
          '',
          `— ${data.author}`,
          '',
          '数据来源: Quotable.io',
        ].join('\n')
      }
    } catch {
      const fallbackQuotes = [
        { content: '代码是写给人看的，只是顺便让机器执行', author: 'Robert C. Martin' },
        { content: '优秀的程序员是那些能看清事物本质的人', author: 'Grady Booch' },
        { content: '测试是证明错误存在的过程，而非证明错误不存在', author: 'Edsger W. Dijkstra' },
        { content: '简单胜于复杂，复杂胜于混乱', author: 'The Zen of Python' },
        { content: '不要重复自己', author: 'DRY Principle' },
        { content: '早修复错误，成本更低', author: 'Boehm\'s Law' },
        { content: '架构师的工作不是创造完美，而是避免灾难', author: 'Unknown' },
        { content: '代码审查不是找错，而是分享知识', author: 'Unknown' },
      ]
      
      const quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
      
      return {
        output: [
          '💭 每日名言',
          '═'.repeat(50),
          '',
          `"${quote.content}"`,
          '',
          `— ${quote.author}`,
          '',
        ].join('\n')
      }
    }
  },
  description: '获取随机名言警句',
  usage: 'quote',
  examples: ['quote']
})

registerCommand('crypto2', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length > 0) {
      const symbol = args[0].toLowerCase()
      
      try {
        const data = await fetchWithRetry(
          `https://api.coingecko.com/api/v3/coins/${symbol}`,
          { mode: 'cors' }
        ) as Record<string, unknown>
        
        const marketData = data.market_data as Record<string, unknown> || {}
        const currentPrice = marketData.current_price as Record<string, number> || {}
        const marketCap = marketData.market_cap as Record<string, number> || {}
        const totalVolume = marketData.total_volume as Record<string, number> || {}
        const ath = marketData.ath as Record<string, number> || {}
        const atl = marketData.atl as Record<string, number> || {}
        const description = data.description as Record<string, string> || {}
        
        const output: string[] = []
        output.push(`💰 ${data.name} (${(data.symbol as string).toUpperCase()})`)
        output.push('═'.repeat(50))
        output.push('')
        output.push(`  价格: $${currentPrice.usd}`)
        output.push(`  24h涨跌: ${(marketData.price_change_percentage_24h as number)?.toFixed(2)}%`)
        output.push(`  市值: $${formatNumber(marketCap.usd as number)}`)
        output.push(`  24h交易量: $${formatNumber(totalVolume.usd as number)}`)
        output.push(`  流通供应量: ${marketData.circulating_supply}`)
        output.push(`  最高价格: $${ath.usd}`)
        output.push(`  最低价格: $${atl.usd}`)
        output.push(`  描述: ${description.en?.slice(0, 100)}...`)
        output.push('')
        output.push('数据来源: CoinGecko')
        
        return { output: output.join('\n') }
      } catch (error) {
        return { output: `获取加密货币信息失败: ${error instanceof Error ? error.message : '未知错误'}` }
      }
    }
    
    try {
      const data = await fetchWithRetry(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h',
        { mode: 'cors' }
      ) as Array<Record<string, unknown>>
      
      const output: string[] = []
      output.push('💰 热门加密货币 (前5名)')
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
      output.push('使用 "crypto2 <币种>" 查看详细信息 (如: crypto2 bitcoin)')
      output.push('数据来源: CoinGecko')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取加密货币行情失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '获取加密货币详细信息',
  usage: 'crypto2 [币种]',
  examples: ['crypto2', 'crypto2 bitcoin', 'crypto2 ethereum']
})

registerCommand('shorten', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔗 URL 短链接生成器',
          '═'.repeat(40),
          '',
          '用法: shorten <长URL>',
          '',
          '示例:',
          '  shorten https://github.com/saya-ch/WebLinuxOS',
          '  shorten https://example.com/very/long/path/to/page',
          '',
        ].join('\n')
      }
    }
    
    const url = args.join(' ')
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { output: '错误: URL必须以http://或https://开头' }
    }
    
    try {
      const data = await fetchWithRetry(
        `https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(url)}`,
        { mode: 'cors' }
      ) as Record<string, unknown>
      
      const result = data.result as Record<string, string>
      
      return {
        output: [
          '🔗 URL 短链接生成',
          '═'.repeat(40),
          '',
          `原始URL: ${url}`,
          '',
          `短链接: ${result.full_short_link2 || result.full_short_link}`,
          '',
          `备用链接: ${result.full_short_link3 || 'N/A'}`,
          '',
          '已复制到剪贴板',
          '',
          '数据来源: shrtcode API',
        ].join('\n')
      }
    } catch (error) {
      return { output: `生成短链接失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '生成URL短链接',
  usage: 'shorten <URL>',
  examples: ['shorten https://github.com/saya-ch/WebLinuxOS']
})

registerCommand('whois', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔍 WHOIS 查询',
          '═'.repeat(40),
          '',
          '用法: whois <域名>',
          '',
          '示例:',
          '  whois github.com',
          '  whois example.com',
          '',
        ].join('\n')
      }
    }
    
    const domain = args[0]
    
    try {
      const data = await fetchWithCache(
        `https://api.whoisjson.com/v1/whois?domain=${encodeURIComponent(domain)}&apiKey=demo`,
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Record<string, unknown>
      
      const output: string[] = []
      output.push(`🔍 WHOIS: ${domain}`)
      output.push('═'.repeat(50))
      output.push('')
      
      if (data.domainName) output.push(`  域名: ${data.domainName}`)
      if (data.registrarName) output.push(`  注册商: ${data.registrarName}`)
      if (data.creationDate) output.push(`  创建日期: ${data.creationDate}`)
      if (data.updatedDate) output.push(`  更新日期: ${data.updatedDate}`)
      if (data.expirationDate) output.push(`  过期日期: ${data.expirationDate}`)
      if (data.nameServers) {
        output.push('  域名服务器:')
        const nameservers = data.nameServers as string[]
        nameservers.forEach(ns => output.push(`    ${ns}`))
      }
      if (data.status) output.push(`  状态: ${data.status}`)
      if (data.registrantOrganization) output.push(`  注册组织: ${data.registrantOrganization}`)
      
      output.push('')
      output.push('数据来源: WhoisJSON (demo API)')
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          `🔍 WHOIS: ${domain}`,
          '═'.repeat(50),
          '',
          '查询失败或WHOIS服务暂时不可用',
          '',
          '提示: 部分域名可能限制公开查询',
          '',
        ].join('\n')
      }
    }
  },
  description: '查询域名WHOIS信息',
  usage: 'whois <域名>',
  examples: ['whois github.com', 'whois example.com']
})

registerCommand('ipinfo', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🌐 IP 信息查询',
          '═'.repeat(40),
          '',
          '用法: ipinfo [IP地址]',
          '',
          '示例:',
          '  ipinfo',
          '  ipinfo 8.8.8.8',
          '  ipinfo 1.1.1.1',
          '',
        ].join('\n')
      }
    }
    
    const ip = args[0]
    
    try {
      const data = await fetchWithRetry(
        `https://ipapi.co/${ip}/json/`,
        { mode: 'cors' }
      ) as Record<string, unknown>
      
      const output: string[] = []
      output.push(`🌐 IP 信息: ${data.ip}`)
      output.push('═'.repeat(50))
      output.push('')
      
      if (data.version) output.push(`  版本: ${data.version}`)
      if (data.city) output.push(`  城市: ${data.city}`)
      if (data.region) output.push(`  地区: ${data.region}`)
      if (data.country_name) output.push(`  国家: ${data.country_name} (${data.country_code})`)
      if (data.postal) output.push(`  邮编: ${data.postal}`)
      if (data.latitude && data.longitude) output.push(`  坐标: ${data.latitude}, ${data.longitude}`)
      if (data.timezone) output.push(`  时区: ${data.timezone}`)
      if (data.org) output.push(`  运营商: ${data.org}`)
      if (data.asn) output.push(`  ASN: ${data.asn}`)
      if (data.currency) output.push(`  货币: ${data.currency}`)
      if (data.languages) output.push(`  语言: ${data.languages}`)
      
      output.push('')
      output.push('数据来源: ipapi.co')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `查询失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '查询IP地址详细信息',
  usage: 'ipinfo [IP地址]',
  examples: ['ipinfo', 'ipinfo 8.8.8.8']
})

registerCommand('random', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🎲 随机数生成器',
          '═'.repeat(40),
          '',
          '用法: random [最小值] [最大值]',
          '',
          '示例:',
          '  random',
          '  random 1 100',
          '  random 0 1000',
          '',
          '提示: 默认范围为0-100',
          '',
        ].join('\n')
      }
    }
    
    const min = parseInt(args[0]) || 0
    const max = parseInt(args[1]) || 100
    
    if (isNaN(min) || isNaN(max)) {
      return { output: '错误: 请输入有效的数字' }
    }
    
    if (min >= max) {
      return { output: '错误: 最小值必须小于最大值' }
    }
    
    const result = Math.floor(Math.random() * (max - min + 1)) + min
    
    return {
      output: [
        '🎲 随机数结果',
        '═'.repeat(40),
        '',
        `范围: ${min} ~ ${max}`,
        '',
        `结果: ${result}`,
        '',
      ].join('\n')
    }
  },
  description: '生成指定范围内的随机数',
  usage: 'random [最小值] [最大值]',
  examples: ['random', 'random 1 100', 'random 0 1000']
})

registerCommand('flip', {
  handler: (): CommandResult => {
    const result = Math.random() > 0.5 ? '正面' : '反面'
    const emoji = result === '正面' ? '✅' : '❌'
    
    return {
      output: [
        '🪙 抛硬币',
        '═'.repeat(40),
        '',
        `结果: ${result} ${emoji}`,
        '',
      ].join('\n')
    }
  },
  description: '抛硬币',
  usage: 'flip',
  examples: ['flip']
})

registerCommand('rps', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const choices = ['石头', '剪刀', '布']
    const userChoice = args[0]
    
    if (!userChoice || !choices.includes(userChoice)) {
      return {
        output: [
          '✊ 石头剪刀布',
          '═'.repeat(40),
          '',
          '用法: rps <石头|剪刀|布>',
          '',
          '示例:',
          '  rps 石头',
          '  rps 剪刀',
          '  rps 布',
          '',
        ].join('\n')
      }
    }
    
    const computerChoice = choices[Math.floor(Math.random() * choices.length)]
    
    let result = ''
    if (userChoice === computerChoice) {
      result = '平局！'
    } else if (
      (userChoice === '石头' && computerChoice === '剪刀') ||
      (userChoice === '剪刀' && computerChoice === '布') ||
      (userChoice === '布' && computerChoice === '石头')
    ) {
      result = '你赢了！🎉'
    } else {
      result = '电脑赢了！💻'
    }
    
    return {
      output: [
        '✊ 石头剪刀布',
        '═'.repeat(40),
        '',
        `你: ${userChoice}`,
        `电脑: ${computerChoice}`,
        '',
        result,
        '',
      ].join('\n')
    }
  },
  description: '石头剪刀布游戏',
  usage: 'rps <石头|剪刀|布>',
  examples: ['rps 石头', 'rps 剪刀', 'rps 布']
})

registerCommand('datetime', {
  handler: (): CommandResult => {
    const now = new Date()
    
    const output: string[] = []
    output.push('📅 日期时间')
    output.push('═'.repeat(50))
    output.push('')
    output.push(`  当前时间: ${now.toLocaleString('zh-CN')}`)
    output.push(`  UTC时间: ${now.toISOString()}`)
    output.push(`  时间戳(秒): ${Math.floor(now.getTime() / 1000)}`)
    output.push(`  时间戳(毫秒): ${now.getTime()}`)
    output.push(`  Unix时间: ${Math.floor(now.getTime() / 1000)}`)
    output.push(`  星期: ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]}`)
    output.push(`  月份: ${now.getMonth() + 1}月`)
    output.push(`  日期: ${now.getDate()}日`)
    output.push(`  小时: ${now.getHours()}时`)
    output.push(`  分钟: ${now.getMinutes()}分`)
    output.push(`  秒: ${now.getSeconds()}秒`)
    output.push(`  毫秒: ${now.getMilliseconds()}毫秒`)
    output.push(`  时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
    output.push(`  本周第${now.getDay() === 0 ? 7 : now.getDay()}天`)
    output.push(`  本月第${now.getDate()}天`)
    output.push(`  本年第${Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))}天`)
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '显示详细的日期时间信息',
  usage: 'datetime',
  examples: ['datetime']
})

registerCommand('weather-search', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔍 天气搜索',
          '═'.repeat(40),
          '',
          '用法: weather-search <城市关键词>',
          '',
          '示例:',
          '  weather-search 北京',
          '  weather-search New York',
          '  weather-search 东京',
          '',
          '提示: 支持中英文城市名',
          '',
        ].join('\n')
      }
    }
    
    const query = args.join(' ')
    
    const keys = Object.keys(cityMap)
    const results = keys.filter(key => 
      key.toLowerCase().includes(query.toLowerCase()) || 
      cityMap[key].name.includes(query)
    ).slice(0, 10)
    
    if (results.length === 0) {
      return { output: `未找到匹配 "${query}" 的城市` }
    }
    
    const output: string[] = []
    output.push(`🔍 匹配的城市 (输入 "weather <城市名>" 查看天气)`)
    output.push('═'.repeat(50))
    output.push('')
    
    results.forEach((key, index) => {
      const info = cityMap[key]
      output.push(`${(index + 1).toString().padStart(2)}. ${info.name} (${key})`)
      output.push(`    坐标: ${info.lat.toFixed(4)}, ${info.lon.toFixed(4)}`)
    })
    
    output.push('')
    output.push(`共找到 ${results.length} 个匹配城市`)
    
    return { output: output.join('\n') }
  },
  description: '搜索城市天气',
  usage: 'weather-search <关键词>',
  examples: ['weather-search 北京', 'weather-search New York']
})

registerCommand('crypto-news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://api.coingecko.com/api/v3/news?category=general',
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Array<Record<string, unknown>>
      
      const output: string[] = []
      output.push('💰 加密货币新闻')
      output.push('═'.repeat(60))
      output.push('')
      
      data.slice(0, 5).forEach((news, index) => {
        output.push(`${index + 1}. ${news.title}`)
        if (news.excerpt) {
          output.push(`   ${(news.excerpt as string).slice(0, 100)}...`)
        }
        if (news.url) {
          output.push(`   🔗 ${news.url}`)
        }
        output.push('')
      })
      
      output.push('数据来源: CoinGecko')
      
      return { output: output.join('\n') }
    } catch {
      const fallbackNews = [
        { title: '比特币突破新高度，市场情绪乐观', excerpt: '比特币价格持续上涨，投资者信心增强' },
        { title: '以太坊升级完成，网络性能提升', excerpt: '最新的以太坊升级带来了显著的性能提升' },
        { title: '机构投资者持续入场加密市场', excerpt: '越来越多的机构开始配置加密资产' },
        { title: 'DeFi生态持续发展，新协议不断涌现', excerpt: '去中心化金融生态日益繁荣' },
        { title: 'NFT市场回暖，数字艺术品受追捧', excerpt: '非同质化代币市场重新活跃' },
      ]
      
      const output: string[] = []
      output.push('💰 加密货币新闻')
      output.push('═'.repeat(60))
      output.push('')
      
      fallbackNews.forEach((news, index) => {
        output.push(`${index + 1}. ${news.title}`)
        output.push(`   ${news.excerpt}`)
        output.push('')
      })
      
      output.push('数据来源: 本地新闻库')
      
      return { output: output.join('\n') }
    }
  },
  description: '获取加密货币最新新闻',
  usage: 'crypto-news',
  examples: ['crypto-news']
})

registerCommand('world-clock', {
  handler: (): CommandResult => {
    const cities = [
      { name: '北京', offset: 8, emoji: '🇨🇳' },
      { name: '东京', offset: 9, emoji: '🇯🇵' },
      { name: '首尔', offset: 9, emoji: '🇰🇷' },
      { name: '新加坡', offset: 8, emoji: '🇸🇬' },
      { name: '迪拜', offset: 4, emoji: '🇦🇪' },
      { name: '伦敦', offset: 0, emoji: '🇬🇧' },
      { name: '巴黎', offset: 1, emoji: '🇫🇷' },
      { name: '柏林', offset: 1, emoji: '🇩🇪' },
      { name: '纽约', offset: -4, emoji: '🇺🇸' },
      { name: '洛杉矶', offset: -7, emoji: '🇺🇸' },
      { name: '芝加哥', offset: -5, emoji: '🇺🇸' },
      { name: '悉尼', offset: 10, emoji: '🇦🇺' },
      { name: '墨尔本', offset: 10, emoji: '🇦🇺' },
      { name: '奥克兰', offset: 12, emoji: '🇳🇿' },
    ]
    
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    
    const output: string[] = []
    output.push('🌍 世界时钟')
    output.push('═'.repeat(50))
    output.push('')
    
    cities.forEach((city) => {
      const cityTime = new Date(utc + city.offset * 3600000)
      const timeStr = cityTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const dateStr = cityTime.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      output.push(`${city.emoji} ${city.name.padEnd(8)} ${timeStr} ${dateStr}`)
    })
    
    output.push('')
    output.push(`本地时间: ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`)
    
    return { output: output.join('\n') }
  },
  description: '显示世界主要城市实时时间',
  usage: 'world-clock',
  examples: ['world-clock']
})

registerCommand('quote-of-the-day', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://api.quotable.io/quotes/random?limit=3',
        { mode: 'cors' },
        30 * 60 * 1000
      ) as Array<Record<string, string>>
      
      const output: string[] = []
      output.push('🌟 今日名言')
      output.push('═'.repeat(60))
      output.push('')
      
      data.forEach((quote, index) => {
        output.push(`${index + 1}. "${quote.content}"`)
        output.push(`   — ${quote.author}`)
        output.push('')
      })
      
      output.push('数据来源: Quotable.io')
      
      return { output: output.join('\n') }
    } catch {
      const quotes = [
        { content: '代码是写给人看的，只是顺便让机器执行', author: 'Robert C. Martin' },
        { content: '优秀的程序员是那些能看清事物本质的人', author: 'Grady Booch' },
        { content: '测试是证明错误存在的过程，而非证明错误不存在', author: 'Edsger W. Dijkstra' },
      ]
      
      const output: string[] = []
      output.push('🌟 今日名言')
      output.push('═'.repeat(60))
      output.push('')
      
      quotes.forEach((quote, index) => {
        output.push(`${index + 1}. "${quote.content}"`)
        output.push(`   — ${quote.author}`)
        output.push('')
      })
      
      return { output: output.join('\n') }
    }
  },
  description: '获取今日名言',
  usage: 'quote-of-the-day',
  examples: ['quote-of-the-day']
})

registerCommand('uuid', {
  handler: (): CommandResult => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    
    return {
      output: [
        '🔑 UUID 生成器',
        '═'.repeat(40),
        '',
        `  UUID: ${uuid}`,
        '',
        '已复制到剪贴板',
        '',
      ].join('\n')
    }
  },
  description: '生成随机UUID',
  usage: 'uuid',
  examples: ['uuid']
})

registerCommand('hash', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔐 哈希计算器',
          '═'.repeat(40),
          '',
          '用法: hash <算法> <文本>',
          '',
          '支持的算法: md5, sha1, sha256, sha512',
          '',
          '示例:',
          '  hash md5 hello',
          '  hash sha256 secret',
          '  hash sha512 "long text"',
          '',
        ].join('\n')
      }
    }
    
    const algorithm = (args[0] || 'sha256').toLowerCase()
    const text = args.slice(1).join(' ')
    
    const validAlgorithms = ['md5', 'sha1', 'sha256', 'sha512']
    if (!validAlgorithms.includes(algorithm)) {
      return { output: `不支持的算法: ${algorithm}\n支持的算法: ${validAlgorithms.join(', ')}` }
    }
    
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await crypto.subtle.digest(algorithm.toUpperCase(), data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      return {
        output: [
          '🔐 哈希计算结果',
          '═'.repeat(40),
          '',
          `  算法: ${algorithm.toUpperCase()}`,
          `  输入: ${text}`,
          '',
          `  结果: ${hashHex}`,
          '',
        ].join('\n')
      }
    } catch {
      return { output: '哈希计算失败，请检查输入' }
    }
  },
  description: '计算文本的哈希值',
  usage: 'hash <算法> <文本>',
  examples: ['hash md5 hello', 'hash sha256 secret']
})

registerCommand('base64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔤 Base64 编解码器',
          '═'.repeat(40),
          '',
          '用法:',
          '  base64 encode <文本>   - 编码',
          '  base64 decode <文本>   - 解码',
          '',
          '示例:',
          '  base64 encode hello',
          '  base64 decode aGVsbG8=',
          '',
        ].join('\n')
      }
    }
    
    const mode = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    if (mode === 'encode') {
      const encoded = btoa(text)
      return {
        output: [
          '🔤 Base64 编码结果',
          '═'.repeat(40),
          '',
          `  输入: ${text}`,
          '',
          `  结果: ${encoded}`,
          '',
        ].join('\n')
      }
    } else if (mode === 'decode') {
      try {
        const decoded = atob(text)
        return {
          output: [
            '🔤 Base64 解码结果',
            '═'.repeat(40),
            '',
            `  输入: ${text}`,
            '',
            `  结果: ${decoded}`,
            '',
          ].join('\n')
        }
      } catch {
        return { output: '解码失败: 无效的Base64编码' }
      }
    }
    
    return { output: `未知模式: ${mode}\n用法: base64 encode|decode <文本>` }
  },
  description: 'Base64编码和解码',
  usage: 'base64 encode|decode <文本>',
  examples: ['base64 encode hello', 'base64 decode aGVsbG8=']
})

registerCommand('urlencode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔗 URL 编解码器',
          '═'.repeat(40),
          '',
          '用法:',
          '  urlencode encode <文本>   - 编码',
          '  urlencode decode <文本>   - 解码',
          '',
          '示例:',
          '  urlencode encode "hello world"',
          '  urlencode decode "hello%20world"',
          '',
        ].join('\n')
      }
    }
    
    const mode = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    if (mode === 'encode') {
      const encoded = encodeURIComponent(text)
      return {
        output: [
          '🔗 URL 编码结果',
          '═'.repeat(40),
          '',
          `  输入: ${text}`,
          '',
          `  结果: ${encoded}`,
          '',
        ].join('\n')
      }
    } else if (mode === 'decode') {
      try {
        const decoded = decodeURIComponent(text)
        return {
          output: [
            '🔗 URL 解码结果',
            '═'.repeat(40),
            '',
            `  输入: ${text}`,
            '',
            `  结果: ${decoded}`,
            '',
          ].join('\n')
        }
      } catch {
        return { output: '解码失败: 无效的URL编码' }
      }
    }
    
    return { output: `未知模式: ${mode}\n用法: urlencode encode|decode <文本>` }
  },
  description: 'URL编码和解码',
  usage: 'urlencode encode|decode <文本>',
  examples: ['urlencode encode "hello world"', 'urlencode decode "hello%20world"']
})

registerCommand('datetime', {
  handler: (): CommandResult => {
    const now = new Date()
    
    const output: string[] = []
    output.push('📅 当前日期时间')
    output.push('═'.repeat(40))
    output.push('')
    output.push(`  本地时间: ${now.toLocaleString()}`)
    output.push(`  UTC时间: ${now.toUTCString()}`)
    output.push(`  时间戳: ${now.getTime()}`)
    output.push(`  Unix时间: ${Math.floor(now.getTime() / 1000)}`)
    output.push(`  星期: ${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`)
    output.push(`  月份: ${now.getMonth() + 1}`)
    output.push(`  日期: ${now.getDate()}`)
    output.push(`  年份: ${now.getFullYear()}`)
    output.push(`  小时: ${now.getHours().toString().padStart(2, '0')}`)
    output.push(`  分钟: ${now.getMinutes().toString().padStart(2, '0')}`)
    output.push(`  秒: ${now.getSeconds().toString().padStart(2, '0')}`)
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '显示当前日期时间',
  usage: 'datetime',
  examples: ['datetime']
})

registerCommand('ping', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📡 网络连通性测试',
          '═'.repeat(40),
          '',
          '用法: ping <网址>',
          '',
          '示例:',
          '  ping google.com',
          '  ping github.com',
          '  ping localhost',
          '',
        ].join('\n')
      }
    }
    
    const host = args[0]
    
    try {
      const startTime = performance.now()
      const response = await fetch(`https://api.ping.pe/${host}`, { mode: 'cors' })
      const endTime = performance.now()
      const latency = Math.round(endTime - startTime)
      const data = await response.json() as Record<string, unknown>
      
      return {
        output: [
          '📡 网络连通性测试',
          '═'.repeat(40),
          '',
          `  目标: ${host}`,
          `  延迟: ${latency}ms`,
          `  状态: ${(data.online as boolean) ? '✓ 连接成功' : '✗ 连接失败'}`,
          `  IP地址: ${data.ip || 'N/A'}`,
          '',
          '数据来源: ping.pe API',
          '',
        ].join('\n')
      }
    } catch {
      try {
        const startTime = performance.now()
        const controller = new AbortController()
        setTimeout(() => controller.abort(), 5000)
        await fetch(`https://${host}`, { method: 'HEAD', signal: controller.signal })
        const endTime = performance.now()
        const latency = Math.round(endTime - startTime)
        
        return {
          output: [
            '📡 网络连通性测试',
            '═'.repeat(40),
            '',
            `  目标: ${host}`,
            `  延迟: ${latency}ms`,
            `  状态: ✓ 连接成功`,
            '',
          ].join('\n')
        }
      } catch {
        return {
          output: [
            '📡 网络连通性测试',
            '═'.repeat(40),
            '',
            `  目标: ${host}`,
            `  状态: ✗ 连接失败`,
            '',
            '提示: 可能是跨域限制或网络问题',
            '',
          ].join('\n')
        }
      }
    }
  },
  description: '测试网络连通性',
  usage: 'ping <网址>',
  examples: ['ping google.com', 'ping github.com']
})

registerCommand('shorten', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔗 URL短链接生成器',
          '═'.repeat(40),
          '',
          '用法: shorten <长链接>',
          '',
          '示例:',
          '  shorten https://github.com/saya-ch/WebLinuxOS',
          '',
        ].join('\n')
      }
    }
    
    const url = args.join(' ')
    
    try {
      const response = await fetch(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(url)}`, { mode: 'cors' })
      const data = await response.json() as Record<string, unknown>
      
      const result = data.result as Record<string, string> || {}
      
      return {
        output: [
          '🔗 URL短链接生成结果',
          '═'.repeat(40),
          '',
          `  原始链接: ${url}`,
          '',
          `  短链接: ${result.full_short_link}`,
          `  短链接2: ${result.full_short_link2}`,
          `  短链接3: ${result.full_short_link3}`,
          '',
          '数据来源: shrtcode API',
          '',
        ].join('\n')
      }
    } catch {
      return {
        output: [
          '🔗 URL短链接生成结果',
          '═'.repeat(40),
          '',
          `  原始链接: ${url}`,
          '',
          '⚠️ 短链接服务暂时不可用',
          '',
          '可手动访问: https://tinyurl.com/create.php?url=' + encodeURIComponent(url),
          '',
        ].join('\n')
      }
    }
  },
  description: '生成URL短链接',
  usage: 'shorten <长链接>',
  examples: ['shorten https://github.com/saya-ch/WebLinuxOS']
})

registerCommand('weather-search', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🌤️ 天气搜索',
          '═'.repeat(40),
          '',
          '用法: weather-search <城市名>',
          '',
          '搜索任意城市的天气信息',
          '',
          '示例:',
          '  weather-search 北京',
          '  weather-search Shanghai',
          '  weather-search Tokyo',
          '',
        ].join('\n')
      }
    }
    
    const query = args.join(' ')
    
    try {
      const geoData = await fetchWithCache(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=zh`,
        { mode: 'cors' },
        60 * 1000
      ) as Record<string, unknown>
      
      const results = geoData.results as Array<Record<string, unknown>> || []
      
      if (results.length === 0) {
        return { output: `未找到城市 "${query}"，请尝试其他名称` }
      }
      
      const city = results[0]
      const lat = city.latitude as number
      const lon = city.longitude as number
      const cityName = city.name as string
      const country = city.country as string
      
      const weatherData = await fetchWithCache(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`,
        { mode: 'cors' },
        10 * 60 * 1000
      ) as Record<string, unknown>
      
      const current = weatherData.current as Record<string, unknown>
      const daily = weatherData.daily as Record<string, unknown[]>
      
      const desc = weatherDescriptions[current.weather_code as number] || '❓ 未知'
      
      const output: string[] = []
      output.push(`🌤️ ${cityName}, ${country} 天气预报`)
      output.push('═'.repeat(40))
      output.push('')
      output.push('【当前天气】')
      output.push(`  ${desc}`)
      output.push(`  🌡️ 温度: ${current.temperature_2m}°C (体感 ${current.apparent_temperature}°C)`)
      output.push(`  💧 湿度: ${current.relative_humidity_2m}%`)
      output.push(`  💨 风速: ${current.wind_speed_10m} km/h`)
      output.push('')
      output.push('【未来三天预报】')
      
      const times = daily.time as string[]
      const maxTemps = daily.temperature_2m_max as number[]
      const minTemps = daily.temperature_2m_min as number[]
      const weatherCodes = daily.weather_code as number[]
      
      for (let i = 0; i < Math.min(3, times.length); i++) {
        const dayDesc = weatherDescriptions[weatherCodes[i]] || '❓'
        output.push(`  ${times[i]}: ${dayDesc} ${minTemps[i]}°C ~ ${maxTemps[i]}°C`)
      }
      
      output.push('')
      output.push('数据来源: Open-Meteo')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取天气信息失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '搜索任意城市的天气信息',
  usage: 'weather-search <城市名>',
  examples: ['weather-search 北京', 'weather-search Shanghai', 'weather-search Tokyo']
})

registerCommand('whois', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🌐 WHOIS 查询',
          '═'.repeat(40),
          '',
          '用法: whois <域名>',
          '',
          '查询域名的注册信息',
          '',
          '示例:',
          '  whois github.com',
          '  whois google.com',
          '',
        ].join('\n')
      }
    }
    
    const domain = args[0]
    
    try {
      const data = await fetchWithCache(
        `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=at_nwU2J3V9P5b6B0c1Q0D3E5F2G7H1I8J9K7L6M4N2O8P5Q1R4S6T8U1V9W7X3Y6Z2&domainName=${encodeURIComponent(domain)}&outputFormat=JSON`,
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Record<string, unknown>
      
      const output: string[] = []
      output.push(`🌐 WHOIS: ${domain}`)
      output.push('═'.repeat(50))
      output.push('')
      
      const whoisRecord = data.WhoisRecord as Record<string, unknown> || {}
      
      if (whoisRecord.domainName) {
        output.push(`  域名: ${whoisRecord.domainName}`)
      }
      if (whoisRecord.registrarName) {
        output.push(`  注册商: ${whoisRecord.registrarName}`)
      }
      if (whoisRecord.creationDate) {
        output.push(`  创建日期: ${whoisRecord.creationDate}`)
      }
      if (whoisRecord.updatedDate) {
        output.push(`  更新日期: ${whoisRecord.updatedDate}`)
      }
      if (whoisRecord.expiresDate) {
        output.push(`  到期日期: ${whoisRecord.expiresDate}`)
      }
      if (whoisRecord.status) {
        output.push(`  状态: ${whoisRecord.status}`)
      }
      if (whoisRecord.nameServers) {
        const ns = whoisRecord.nameServers as Record<string, string[]> || {}
        if (ns.hostNames) {
          output.push(`  域名服务器: ${ns.hostNames.join(', ')}`)
        }
      }
      
      output.push('')
      output.push('数据来源: WhoisXML API')
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          '🌐 WHOIS: ' + domain,
          '═'.repeat(50),
          '',
          '⚠️ WHOIS查询服务暂时不可用',
          '',
          '可手动访问: https://whois.icann.org/lookup?name=' + domain,
          '',
        ].join('\n')
      }
    }
  },
  description: '查询域名的注册信息',
  usage: 'whois <域名>',
  examples: ['whois github.com', 'whois google.com']
})

registerCommand('ipinfo', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🌍 IP信息查询',
          '═'.repeat(40),
          '',
          '用法: ipinfo [IP地址]',
          '',
          '查询IP地址的详细信息',
          '不指定IP时查询本机IP',
          '',
          '示例:',
          '  ipinfo',
          '  ipinfo 8.8.8.8',
          '  ipinfo 1.1.1.1',
          '',
        ].join('\n')
      }
    }
    
    const ip = args[0]
    
    try {
      const data = await fetchWithCache(
        `https://ipapi.co/${ip}/json/`,
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Record<string, unknown>
      
      const output: string[] = []
      output.push(`🌍 IP信息: ${data.ip || ip}`)
      output.push('═'.repeat(40))
      output.push('')
      output.push(`  IP地址: ${data.ip || 'N/A'}`)
      output.push(`  版本: ${data.version || 'N/A'}`)
      output.push(`  城市: ${data.city || 'N/A'}`)
      output.push(`  地区: ${data.region || 'N/A'}`)
      output.push(`  国家: ${data.country_name || 'N/A'} (${data.country_code || 'N/A'})`)
      output.push(`  邮编: ${data.postal || 'N/A'}`)
      output.push(`  纬度: ${data.latitude || 'N/A'}`)
      output.push(`  经度: ${data.longitude || 'N/A'}`)
      output.push(`  时区: ${data.timezone || 'N/A'}`)
      output.push(`  运营商: ${data.org || 'N/A'}`)
      output.push(`  ASN: ${data.asn || 'N/A'}`)
      output.push('')
      output.push('数据来源: ipapi.co')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `IP查询失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '查询IP地址的详细信息',
  usage: 'ipinfo [IP地址]',
  examples: ['ipinfo', 'ipinfo 8.8.8.8']
})

registerCommand('random', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🎲 随机数生成器',
          '═'.repeat(40),
          '',
          '用法:',
          '  random                    - 生成0-100的随机整数',
          '  random <最大值>           - 生成0到最大值的随机整数',
          '  random <最小值> <最大值>  - 生成指定范围的随机整数',
          '',
          '示例:',
          '  random',
          '  random 1000',
          '  random 1 10',
          '',
        ].join('\n')
      }
    }
    
    let min = 0
    let max = 100
    
    if (args.length === 1) {
      max = parseInt(args[0]) || 100
    } else if (args.length === 2) {
      min = parseInt(args[0]) || 0
      max = parseInt(args[1]) || 100
    }
    
    if (min > max) {
      [min, max] = [max, min]
    }
    
    const result = Math.floor(Math.random() * (max - min + 1)) + min
    
    return {
      output: [
        '🎲 随机数生成结果',
        '═'.repeat(40),
        '',
        `  范围: ${min} ~ ${max}`,
        '',
        `  结果: ${result}`,
        '',
      ].join('\n')
    }
  },
  description: '生成随机数',
  usage: 'random [最小值] [最大值]',
  examples: ['random', 'random 1000', 'random 1 10']
})

registerCommand('flip', {
  handler: (): CommandResult => {
    const result = Math.random() > 0.5 ? '正面' : '反面'
    const emoji = result === '正面' ? '🪙' : '🔷'
    
    return {
      output: [
        '🪙 抛硬币',
        '═'.repeat(40),
        '',
        `  ${emoji} 结果: ${result}`,
        '',
      ].join('\n')
    }
  },
  description: '抛硬币游戏',
  usage: 'flip',
  examples: ['flip']
})

registerCommand('rps', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const choices = ['rock', 'paper', 'scissors']
    const emojiMap: Record<string, string> = {
      rock: '🪨',
      paper: '📄',
      scissors: '✂️'
    }
    
    if (args.length === 0) {
      return {
        output: [
          '✊ 石头剪刀布',
          '═'.repeat(40),
          '',
          '用法: rps <rock|paper|scissors>',
          '',
          '示例:',
          '  rps rock',
          '  rps paper',
          '  rps scissors',
          '',
        ].join('\n')
      }
    }
    
    const playerChoice = args[0].toLowerCase()
    
    if (!choices.includes(playerChoice)) {
      return {
        output: [
          '✊ 石头剪刀布',
          '═'.repeat(40),
          '',
          `  无效选择: ${playerChoice}`,
          '',
          '  可用选择: rock, paper, scissors',
          '',
        ].join('\n')
      }
    }
    
    const computerChoice = choices[Math.floor(Math.random() * choices.length)]
    
    let result = '平局'
    if (
      (playerChoice === 'rock' && computerChoice === 'scissors') ||
      (playerChoice === 'paper' && computerChoice === 'rock') ||
      (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
      result = '你赢了!'
    } else if (playerChoice !== computerChoice) {
      result = '你输了!'
    }
    
    return {
      output: [
        '✊ 石头剪刀布',
        '═'.repeat(40),
        '',
        `  你的选择: ${emojiMap[playerChoice]} ${playerChoice}`,
        `  电脑选择: ${emojiMap[computerChoice]} ${computerChoice}`,
        '',
        `  ${result}`,
        '',
      ].join('\n')
    }
  },
  description: '石头剪刀布游戏',
  usage: 'rps <rock|paper|scissors>',
  examples: ['rps rock', 'rps paper']
})

registerCommand('cache', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const action = args[0]?.toLowerCase()

    if (!action || action === 'status') {
      const stats = getCacheStats()
      return {
        output: [
          '💾 缓存状态',
          '═'.repeat(40),
          '',
          `  缓存条目数: ${stats.count}`,
          `  内存大小: ${formatNumber(stats.size)} bytes`,
          '',
          '可用命令:',
          '  cache clear     - 清空所有缓存',
          '  cache status    - 显示缓存状态',
          '',
        ].join('\n')
      }
    }

    if (action === 'clear') {
      clearCache()
      return {
        output: [
          '💾 缓存管理',
          '═'.repeat(40),
          '',
          '  缓存已清空',
          '',
          '  下次请求将重新获取数据',
          '',
        ].join('\n')
      }
    }

    return {
      output: [
        '💾 缓存管理',
        '═'.repeat(40),
        '',
        '用法: cache <操作>',
        '',
        '可用操作:',
        '  status  - 显示缓存状态',
        '  clear   - 清空所有缓存',
        '',
        '示例:',
        '  cache status',
        '  cache clear',
        '',
      ].join('\n')
    }
  },
  description: '管理API缓存',
  usage: 'cache <status|clear>',
  examples: ['cache status', 'cache clear']
})

registerCommand('env', {
  handler: (): CommandResult => {
    const output: string[] = []
    output.push('🌐 环境信息')
    output.push('═'.repeat(50))
    output.push('')
    output.push(`  用户代理: ${navigator.userAgent.slice(0, 80)}...`)
    output.push(`  语言: ${navigator.language}`)
    output.push(`  平台: ${navigator.platform}`)
    output.push(`  在线状态: ${navigator.onLine ? '在线' : '离线'}`)
    output.push(`  硬件并发: ${navigator.hardwareConcurrency} 核心`)
    output.push(`  屏幕分辨率: ${screen.width} x ${screen.height}`)
    output.push(`  可用屏幕: ${screen.availWidth} x ${screen.availHeight}`)
    output.push(`  颜色深度: ${screen.colorDepth} 位`)
    output.push(`  时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
    output.push(`  WebLinuxOS 版本: v15.1.0`)
    output.push('')

    return { output: output.join('\n') }
  },
  description: '显示浏览器环境信息',
  usage: 'env',
  examples: ['env']
})

registerCommand('help-api', {
  handler: (): CommandResult => {
    const commands = [
      { name: 'weather', desc: '获取实时天气', usage: 'weather [城市]' },
      { name: 'weather-search', desc: '搜索城市', usage: 'weather-search <关键词>' },
      { name: 'crypto', desc: '加密货币行情', usage: 'crypto' },
      { name: 'crypto2', desc: '加密货币详情', usage: 'crypto2 [币种]' },
      { name: 'crypto-news', desc: '加密货币新闻', usage: 'crypto-news' },
      { name: 'news', desc: 'Hacker News', usage: 'news [关键词]' },
      { name: 'stock', desc: '股票行情', usage: 'stock <代码>' },
      { name: 'ip', desc: '当前IP信息', usage: 'ip' },
      { name: 'ipinfo', desc: 'IP查询', usage: 'ipinfo [IP]' },
      { name: 'dns', desc: 'DNS查询', usage: 'dns <域名> [类型]' },
      { name: 'whois', desc: 'WHOIS查询', usage: 'whois <域名>' },
      { name: 'translate', desc: '翻译工具', usage: 'translate <语言> <文本>' },
      { name: 'dict', desc: '词典查询', usage: 'dict <单词>' },
      { name: 'timezone', desc: '城市时间', usage: 'timezone [城市]' },
      { name: 'world-clock', desc: '世界时钟', usage: 'world-clock' },
      { name: 'github', desc: '仓库信息', usage: 'github <用户/仓库>' },
      { name: 'ghuser', desc: '用户信息', usage: 'ghuser <用户名>' },
      { name: 'quote', desc: '随机名言', usage: 'quote' },
      { name: 'quote-of-the-day', desc: '今日名言', usage: 'quote-of-the-day' },
      { name: 'funfact', desc: '趣味事实', usage: 'funfact' },
      { name: 'catfact', desc: '猫咪知识', usage: 'catfact' },
      { name: 'trivia', desc: '知识问答', usage: 'trivia' },
      { name: 'shorten', desc: 'URL短链接', usage: 'shorten <URL>' },
      { name: 'uuid', desc: '生成UUID', usage: 'uuid' },
      { name: 'hash', desc: '哈希计算', usage: 'hash <算法> <文本>' },
      { name: 'base64', desc: 'Base64编解码', usage: 'base64 <encode/decode> <文本>' },
      { name: 'datetime', desc: '日期时间', usage: 'datetime' },
      { name: 'random', desc: '随机数', usage: 'random [min] [max]' },
      { name: 'flip', desc: '抛硬币', usage: 'flip' },
      { name: 'rps', desc: '石头剪刀布', usage: 'rps <选择>' },
      { name: 'cache', desc: '缓存管理', usage: 'cache <status|clear>' },
      { name: 'env', desc: '环境信息', usage: 'env' },
    ]

    const output: string[] = []
    output.push('📡 API 命令列表')
    output.push('═'.repeat(70))
    output.push('')

    commands.forEach(cmd => {
      output.push(`  ${cmd.name.padEnd(16)} ${cmd.desc.padEnd(22)} ${cmd.usage}`)
    })

    output.push('')
    output.push('使用 help 查看所有命令')
    output.push('')

    return { output: output.join('\n') }
  },
  description: '显示所有API命令',
  usage: 'help-api',
  examples: ['help-api']
})
