import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithCache, formatNumber } from '../../utils/apiCache'

registerCommand('news', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const category = args[0] || 'general'
    const validCategories = ['general', 'business', 'technology', 'science', 'health', 'entertainment', 'sports']
    
    if (!validCategories.includes(category)) {
      return { output: `无效的类别: ${category}\n支持的类别: ${validCategories.join(', ')}` }
    }

    try {
      const data = await fetchWithCache(
        `https://newsapi.org/v2/top-headlines?category=${category}&language=zh&pageSize=10&apiKey=demo`,
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Record<string, unknown>

      const articles = data.articles as Array<Record<string, unknown>> || []
      
      if (articles.length === 0) {
        return { output: '暂无新闻数据' }
      }

      const output: string[] = []
      output.push(`📰 ${category === 'general' ? '综合新闻' : category} - 最新资讯`)
      output.push('═'.repeat(60))
      output.push('')

      articles.slice(0, 10).forEach((article, index) => {
        const title = article.title as string || ''
        const sourceData = article.source as Record<string, unknown> || {}
        const source = sourceData.name as string || ''
        const url = article.url as string || ''
        output.push(`${index + 1}. ${title}`)
        output.push(`   📤 ${source}`)
        output.push(`   🔗 ${url}`)
        output.push('')
      })

      output.push('数据来源: NewsAPI')
      return { output: output.join('\n') }
    } catch {
      return { output: '⚠️ 新闻服务暂时不可用，请稍后重试' }
    }
  },
  description: '获取最新新闻资讯',
  usage: 'news [category]',
  examples: ['news', 'news technology', 'news business']
})

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const from = args[0]?.toUpperCase() || 'USD'
    const to = args[1]?.toUpperCase() || 'CNY'
    const amount = parseFloat(args[2]) || 1

    try {
      const data = await fetchWithCache(
        `https://api.exchangerate-api.com/v4/latest/${from}`,
        { mode: 'cors' },
        10 * 60 * 1000
      ) as Record<string, unknown>

      const rates = data.rates as Record<string, number> || {}
      const rate = rates[to]

      if (!rate) {
        return { output: `⚠️ 无法获取 ${to} 的汇率` }
      }

      const result = amount * rate
      const date = data.date as string || ''

      const output: string[] = []
      output.push(`💱 汇率查询: ${from} → ${to}`)
      output.push('═'.repeat(40))
      output.push('')
      output.push(`1 ${from} = ${rate.toFixed(4)} ${to}`)
      output.push(`${amount} ${from} = ${result.toFixed(4)} ${to}`)
      output.push(`更新时间: ${date}`)
      output.push('')
      output.push('支持的货币: USD, CNY, EUR, JPY, GBP, AUD, CAD, CHF, HKD, SGD, KRW等')

      return { output: output.join('\n') }
    } catch {
      return { output: '⚠️ 汇率服务暂时不可用，请稍后重试' }
    }
  },
  description: '实时汇率查询',
  usage: 'currency [from] [to] [amount]',
  examples: ['currency', 'currency USD CNY', 'currency EUR USD 100']
})

registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const symbol = args[0]?.toUpperCase() || 'BTC'

    try {
      const data = await fetchWithCache(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${symbol.toLowerCase()}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`,
        { mode: 'cors' },
        2 * 60 * 1000
      ) as Array<Record<string, unknown>>

      const coin = data[0]

      if (!coin) {
        return { output: `⚠️ 无法获取 ${symbol} 的数据` }
      }

      const name = coin.name as string || ''
      const symbolCoin = coin.symbol as string || ''
      const price = coin.current_price as number || 0
      const marketCap = coin.market_cap as number || 0
      const volume = coin.total_volume as number || 0
      const change24h = coin.price_change_percentage_24h as number || 0
      const high24h = coin.high_24h as number || 0
      const low24h = coin.low_24h as number || 0

      const output: string[] = []
      output.push(`💰 ${name} (${symbolCoin})`)
      output.push('═'.repeat(50))
      output.push('')
      output.push(`当前价格: $${formatNumber(price)}`)
      output.push(`24h 涨跌: ${change24h >= 0 ? '📈' : '📉'} ${change24h.toFixed(2)}%`)
      output.push(`24h 最高: $${formatNumber(high24h)}`)
      output.push(`24h 最低: $${formatNumber(low24h)}`)
      output.push(`市值: $${formatNumber(marketCap)}`)
      output.push(`24h 交易量: $${formatNumber(volume)}`)
      output.push('')
      output.push('数据来源: CoinGecko')

      return { output: output.join('\n') }
    } catch {
      return { output: '⚠️ 加密货币服务暂时不可用，请稍后重试' }
    }
  },
  description: '实时加密货币价格',
  usage: 'crypto [symbol]',
  examples: ['crypto', 'crypto BTC', 'crypto ETH', 'crypto SOL']
})

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: translate <文本> [目标语言]\n支持语言: en, zh, ja, ko, fr, de, es, ru, pt, it' }
    }

    const text = args.slice(0, -1).join(' ') || args[0]
    const targetLang = args[args.length - 1].toLowerCase()

    const isLang = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'pt', 'it'].includes(targetLang)
    const dest = isLang ? targetLang : 'zh'
    const sourceText = isLang ? text : args.join(' ')

    try {
      const data = await fetchWithCache(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=auto|${dest}`,
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Record<string, unknown>

      const matches = data.matches as Array<Record<string, unknown>> || []
      const translation = matches[0]?.translation as string || ''

      if (!translation) {
        return { output: '⚠️ 翻译失败，请重试' }
      }

      const output: string[] = []
      output.push(`🔤 翻译结果:`)
      output.push('═'.repeat(40))
      output.push('')
      output.push(`原文: ${sourceText}`)
      output.push(`译文: ${translation}`)
      output.push('')

      return { output: output.join('\n') }
    } catch {
      return { output: '⚠️ 翻译服务暂时不可用，请稍后重试' }
    }
  },
  description: '文本翻译',
  usage: 'translate <文本> [目标语言]',
  examples: ['translate Hello world', 'translate 你好世界 en', 'translate Bonjour fr']
})

registerCommand('timezone', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const timezone = args[0] || 'Asia/Shanghai'

    try {
      const data = await fetchWithCache(
        `https://worldtimeapi.org/api/timezone/${timezone}`,
        { mode: 'cors' },
        60 * 1000
      ) as Record<string, unknown>

      const datetime = data.datetime as string || ''
      const timezoneName = data.timezone as string || ''
      const abbreviation = data.abbreviation as string || ''
      const dayOfWeek = data.day_of_week as number || 0
      const dayOfYear = data.day_of_year as number || 0
      const weekNumber = data.week_number as number || 0
      const dst = data.dst as boolean || false

      const date = new Date(datetime)
      const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

      const output: string[] = []
      output.push(`🕐 ${timezoneName} (${abbreviation})`)
      output.push('═'.repeat(40))
      output.push('')
      output.push(`日期: ${dateStr}`)
      output.push(`时间: ${timeStr}`)
      output.push(`星期: ${days[dayOfWeek]}`)
      output.push(`年内第 ${dayOfYear} 天`)
      output.push(`周数: ${weekNumber}`)
      output.push(`夏令时: ${dst ? '启用' : '未启用'}`)
      output.push('')
      output.push('常用时区: Asia/Shanghai, America/New_York, Europe/London, Asia/Tokyo')

      return { output: output.join('\n') }
    } catch {
      return { output: `⚠️ 无法获取时区 ${timezone} 的数据\n常用时区: Asia/Shanghai, America/New_York, Europe/London` }
    }
  },
  description: '获取指定时区的当前时间',
  usage: 'timezone [timezone]',
  examples: ['timezone', 'timezone America/New_York', 'timezone Europe/London']
})

registerCommand('ipinfo', {
  handler: async (_context: CommandContext): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://ipapi.co/json/',
        { mode: 'cors' },
        30 * 60 * 1000
      ) as Record<string, unknown>

      const ip = data.ip as string || ''
      const city = data.city as string || ''
      const region = data.region as string || ''
      const country = data.country_name as string || ''
      const countryCode = data.country_code as string || ''
      const latitude = data.latitude as number || 0
      const longitude = data.longitude as number || 0
      const timezone = data.timezone as string || ''
      const isp = data.org as string || ''
      const currency = data.currency as string || ''
      const currencyName = data.currency_name as string || ''

      const output: string[] = []
      output.push(`🌐 IP 信息查询`)
      output.push('═'.repeat(40))
      output.push('')
      output.push(`IP 地址: ${ip}`)
      output.push(`国家: ${country} (${countryCode})`)
      output.push(`地区: ${region}`)
      output.push(`城市: ${city}`)
      output.push(`坐标: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
      output.push(`时区: ${timezone}`)
      output.push(`ISP: ${isp}`)
      output.push(`货币: ${currency} (${currencyName})`)
      output.push('')

      return { output: output.join('\n') }
    } catch {
      return { output: '⚠️ 无法获取IP信息，请检查网络连接' }
    }
  },
  description: '获取当前IP地址的详细信息',
  usage: 'ipinfo',
  examples: ['ipinfo']
})

registerCommand('qr', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return { output: '用法: qr <文本>\n生成二维码链接' }
    }

    const encoded = encodeURIComponent(text)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`

    const output: string[] = []
    output.push(`📷 二维码生成`)
    output.push('═'.repeat(40))
    output.push('')
    output.push(`内容: ${text}`)
    output.push(`二维码链接: ${qrUrl}`)
    output.push('')
    output.push('在浏览器中打开上方链接查看二维码')

    return { output: output.join('\n') }
  },
  description: '生成文本的二维码',
  usage: 'qr <文本>',
  examples: ['qr https://github.com', 'qr 你好世界', 'qr 123456']
})

registerCommand('uuid', {
  handler: (): CommandResult => {
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    const output: string[] = []
    output.push(`🆔 UUID 生成`)
    output.push('═'.repeat(40))
    output.push('')
    output.push(`UUID v4: ${generateUUID()}`)
    output.push(`UUID v4: ${generateUUID()}`)
    output.push(`UUID v4: ${generateUUID()}`)
    output.push('')

    return { output: output.join('\n') }
  },
  description: '生成UUID',
  usage: 'uuid',
  examples: ['uuid']
})

registerCommand('password', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const length = parseInt(args[0]) || 16
    const includeSymbols = !args.includes('--no-symbols')

    if (length < 8 || length > 128) {
      return { output: '密码长度必须在8-128之间' }
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const allChars = includeSymbols ? chars + symbols : chars

    const generatePassword = () => {
      let password = ''
      const array = new Uint32Array(length)
      crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        password += allChars[array[i] % allChars.length]
      }
      return password
    }

    const output: string[] = []
    output.push(`🔐 随机密码生成`)
    output.push('═'.repeat(40))
    output.push('')
    output.push(`长度: ${length} 字符`)
    output.push(`包含特殊字符: ${includeSymbols ? '是' : '否'}`)
    output.push('')
    output.push(`密码 1: ${generatePassword()}`)
    output.push(`密码 2: ${generatePassword()}`)
    output.push(`密码 3: ${generatePassword()}`)
    output.push('')

    return { output: output.join('\n') }
  },
  description: '生成随机密码',
  usage: 'password [长度] [--no-symbols]',
  examples: ['password', 'password 24', 'password 12 --no-symbols']
})

registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length > 0) {
      const timestamp = parseInt(args[0])
      if (!isNaN(timestamp)) {
        const date = new Date(timestamp * 1000)
        const output: string[] = []
        output.push(`📅 时间戳转换`)
        output.push('═'.repeat(40))
        output.push('')
        output.push(`时间戳: ${timestamp}`)
        output.push(`日期时间: ${date.toLocaleString('zh-CN')}`)
        output.push(`ISO: ${date.toISOString()}`)
        output.push('')
        return { output: output.join('\n') }
      }
    }

    const now = Date.now()
    const date = new Date(now)

    const output: string[] = []
    output.push(`📅 当前时间戳`)
    output.push('═'.repeat(40))
    output.push('')
    output.push(`毫秒: ${now}`)
    output.push(`秒: ${Math.floor(now / 1000)}`)
    output.push(`日期时间: ${date.toLocaleString('zh-CN')}`)
    output.push(`ISO: ${date.toISOString()}`)
    output.push('')
    output.push('用法: timestamp [时间戳(秒)] 可转换指定时间戳')

    return { output: output.join('\n') }
  },
  description: '显示当前时间戳或转换指定时间戳',
  usage: 'timestamp [时间戳]',
  examples: ['timestamp', 'timestamp 1609459200']
})