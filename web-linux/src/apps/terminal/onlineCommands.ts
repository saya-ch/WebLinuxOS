import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=7453d6a418e4bc4a2e90c7038c7b4894&units=metric&lang=zh_cn`)
      
      if (!response.ok) {
        throw new Error('查询失败')
      }
      
      const data = await response.json()
      
      const output = [
        '🌤️  天气预报',
        '',
        `城市: ${data.name}`,
        `国家: ${data.sys?.country || '未知'}`,
        '',
        `天气: ${data.weather?.[0]?.description || '未知'}`,
        `温度: ${data.main?.temp || 'N/A'}°C`,
        `体感温度: ${data.main?.feels_like || 'N/A'}°C`,
        `最高温度: ${data.main?.temp_max || 'N/A'}°C`,
        `最低温度: ${data.main?.temp_min || 'N/A'}°C`,
        '',
        `湿度: ${data.main?.humidity || 'N/A'}%`,
        `气压: ${data.main?.pressure || 'N/A'} hPa`,
        `风速: ${data.wind?.speed || 'N/A'} m/s`,
        `能见度: ${data.visibility ? (data.visibility / 1000).toFixed(1) + ' km' : '未知'}`,
        '',
        `日出时间: ${data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString('zh-CN') : '未知'}`,
        `日落时间: ${data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString('zh-CN') : '未知'}`,
        '',
        '数据来源: OpenWeatherMap',
      ]
      
      return { output: output.join('\n') }
    } catch {
      const fallbackWeather: Record<string, { temp: number; desc: string; humidity: number }> = {
        'beijing': { temp: 25, desc: '晴朗', humidity: 45 },
        'shanghai': { temp: 28, desc: '多云', humidity: 65 },
        'tokyo': { temp: 22, desc: '阴天', humidity: 70 },
        'newyork': { temp: 20, desc: '晴朗', humidity: 50 },
        'london': { temp: 15, desc: '小雨', humidity: 80 },
      }
      
      const weather = fallbackWeather[city.toLowerCase()] || { temp: 20, desc: '未知', humidity: 50 }
      
      return {
        output: [
          '🌤️  天气预报',
          '',
          `城市: ${city}`,
          '',
          `天气: ${weather.desc}`,
          `温度: ${weather.temp}°C`,
          `湿度: ${weather.humidity}%`,
          '',
          '提示: 使用备用数据源，某些城市可能无法查询',
          '',
          '用法: weather <城市名>',
          '示例: weather Beijing, weather Tokyo',
        ].join('\n')
      }
    }
  },
  description: '查询天气',
  usage: 'weather [城市]',
  examples: ['weather', 'weather Beijing', 'weather Shanghai']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://newsapi.org/v2/top-headlines?country=cn&apiKey=1d4b72522d7d426f8c94f665d6d70066&pageSize=10')
      
      if (!response.ok) {
        throw new Error('查询失败')
      }
      
      const data = await response.json()
      
      if (!data.articles || data.articles.length === 0) {
        throw new Error('无新闻数据')
      }
      
      const output = [
        '📰 新闻头条',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        ...data.articles.slice(0, 10).map((article: { title: string; source: { name: string }; url: string }, index: number) => 
          `${(index + 1).toString().padStart(2)}. ${article.title}\n     来源: ${article.source.name}\n     链接: ${article.url}\n`
        ),
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '数据来源: NewsAPI',
      ]
      
      return { output: output.join('\n') }
    } catch {
      const fallbackNews = [
        { title: 'WebLinuxOS 2.9.0 正式发布，新增多项实用功能', source: 'WebLinuxOS官方', url: 'https://github.com/saya-ch/WebLinuxOS' },
        { title: 'AI技术持续发展，改变软件开发方式', source: '科技新闻', url: '#' },
        { title: 'WebAssembly 性能大幅提升，Web应用迎来新机遇', source: '技术周刊', url: '#' },
        { title: '开源社区活跃，贡献者数量创历史新高', source: '开源资讯', url: '#' },
        { title: '云计算市场持续增长，边缘计算成为新热点', source: '行业报告', url: '#' },
      ]
      
      return {
        output: [
          '📰 新闻头条',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          ...fallbackNews.map((news, index) => 
            `${(index + 1).toString().padStart(2)}. ${news.title}\n     来源: ${news.source}\n`
          ),
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '提示: 使用备用数据源',
        ].join('\n')
      }
    }
  },
  description: '显示新闻头条',
  usage: 'news',
  examples: ['news']
})

registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2Cethereum%2Cbinancecoin%2Cripple%2Csolana%2Ccardano%2Cdogecoin%2Cusd-coin%2Cpolygon%2Cstaked-ether&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h')
      
      if (!response.ok) {
        throw new Error('查询失败')
      }
      
      const data = await response.json()
      
      if (args.length > 0) {
        const symbol = args[0].toLowerCase()
        const coin = data.find((c: { symbol: string }) => c.symbol === symbol)
        
        if (coin) {
          return {
            output: [
              `💰 ${coin.name} (${coin.symbol.toUpperCase()})`,
              '',
              `价格: $${coin.current_price?.toLocaleString() || 'N/A'}`,
              `24h涨跌: ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || 'N/A'}%`,
              `24h成交量: $${coin.total_volume?.toLocaleString() || 'N/A'}`,
              `市值: $${coin.market_cap?.toLocaleString() || 'N/A'}`,
              `排名: #${coin.market_cap_rank || 'N/A'}`,
              `流通量: ${coin.symbol.toUpperCase()} ${coin.circulating_supply?.toLocaleString() || 'N/A'}`,
            ].join('\n')
          }
        }
        
        return { output: `crypto: 未找到币种 '${symbol}'` }
      }
      
      const output = [
        '💰 加密货币行情',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${'排名'.padEnd(4)} ${'币种'.padEnd(10)} ${'价格'.padEnd(16)} ${'24h涨跌'.padEnd(12)} ${'市值'.padEnd(20)}`,
        ...data.map((coin: { symbol: string; name: string; current_price: number; price_change_percentage_24h: number; market_cap: number; market_cap_rank: number }) => {
          const change = coin.price_change_percentage_24h >= 0 ? '+' : ''
          const changeColor = coin.price_change_percentage_24h >= 0 ? '\x1b[32m' : '\x1b[31m'
          return `${coin.market_cap_rank.toString().padEnd(4)} ${coin.symbol.toUpperCase().padEnd(10)} $${coin.current_price.toLocaleString().padEnd(14)} ${changeColor}${change}${coin.price_change_percentage_24h.toFixed(2)}%\x1b[0m $${coin.market_cap.toLocaleString().padEnd(18)}`
        }),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '数据来源: CoinGecko',
        '用法: crypto <币种代码> 查看详情',
        '示例: crypto btc, crypto eth',
      ]
      
      return { output: output.join('\n') }
    } catch {
      const fallbackCoins = [
        { symbol: 'BTC', name: 'Bitcoin', price: 67500, change: 2.5, cap: 1350000000000 },
        { symbol: 'ETH', name: 'Ethereum', price: 3500, change: -1.2, cap: 420000000000 },
        { symbol: 'BNB', name: 'Binance', price: 610, change: 1.8, cap: 98000000000 },
        { symbol: 'SOL', name: 'Solana', price: 178, change: 5.2, cap: 68000000000 },
        { symbol: 'XRP', name: 'Ripple', price: 0.62, change: -0.8, cap: 32000000000 },
      ]
      
      return {
        output: [
          '💰 加密货币行情',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `${'币种'.padEnd(6)} ${'名称'.padEnd(10)} ${'价格'.padEnd(12)} ${'24h涨跌'.padEnd(10)}`,
          ...fallbackCoins.map(coin => {
            const change = coin.change >= 0 ? '+' : ''
            return `${coin.symbol.padEnd(6)} ${coin.name.padEnd(10)} $${coin.price.toLocaleString().padEnd(10)} ${change}${coin.change}%`
          }),
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '提示: 使用备用数据源',
          '用法: crypto <币种代码> 查看详情',
        ].join('\n')
      }
    }
  },
  description: '加密货币行情',
  usage: 'crypto [币种]',
  examples: ['crypto', 'crypto btc', 'crypto eth']
})

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🌍 翻译工具',
          '',
          '用法: translate <文本>',
          '',
          '示例:',
          '  translate Hello World',
          '  translate 你好世界',
          '  translate Bonjour le monde',
          '',
          '提示: 自动检测语言并翻译为中文',
        ].join('\n')
      }
    }
    
    const text = args.join(' ')
    
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|zh-CN`)
      
      if (!response.ok) {
        throw new Error('翻译失败')
      }
      
      const data = await response.json()
      
      if (data.responseData && data.responseData.translatedText) {
        return {
          output: [
            '🌍 翻译结果',
            '',
            `原文: ${text}`,
            `译文: ${data.responseData.translatedText}`,
            '',
            `源语言: ${data.responseData.src || '自动检测'}`,
            '目标语言: 中文',
            '',
            '数据来源: MyMemory Translation API',
          ].join('\n')
        }
      }
      
      throw new Error('无翻译结果')
    } catch {
      const translations: Record<string, string> = {
        'hello': '你好',
        'world': '世界',
        'hello world': '你好世界',
        'good morning': '早上好',
        'thank you': '谢谢',
        'goodbye': '再见',
        'welcome': '欢迎',
        'computer': '计算机',
        'code': '代码',
        'program': '程序',
        'internet': '互联网',
        '你好': 'Hello',
        '世界': 'World',
        '你好世界': 'Hello World',
        '早上好': 'Good morning',
        '谢谢': 'Thank you',
        '再见': 'Goodbye',
        '欢迎': 'Welcome',
        '计算机': 'Computer',
        '代码': 'Code',
        '程序': 'Program',
        '互联网': 'Internet',
      }
      
      const translation = translations[text.toLowerCase()] || '无法翻译'
      
      return {
        output: [
          '🌍 翻译结果',
          '',
          `原文: ${text}`,
          `译文: ${translation}`,
          '',
          '提示: 使用本地词典（部分词汇）',
        ].join('\n')
      }
    }
  },
  description: '翻译文本',
  usage: 'translate <文本>',
  examples: ['translate Hello World', 'translate 你好世界']
})

registerCommand('quote', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://api.quotable.io/random')
      
      if (!response.ok) {
        throw new Error('获取失败')
      }
      
      const data = await response.json()
      
      return {
        output: [
          '💬 每日名言',
          '',
          `"${data.content}"`,
          '',
          `— ${data.author || 'Unknown'}`,
          '',
          `标签: ${data.tags?.join(', ') || ''}`,
        ].join('\n')
      }
    } catch {
      const quotes = [
        { content: '成功不是最终的，失败也不是致命的：重要的是继续前进的勇气。', author: 'Winston Churchill' },
        { content: '生活不是等待风暴过去，而是学会在雨中翩翩起舞。', author: 'Vivian Greene' },
        { content: '唯一不可能的事是你不去尝试。', author: 'Audrey Hepburn' },
        { content: '成功的秘诀在于始终如一地坚持目标。', author: 'Benjamin Disraeli' },
        { content: '不要等待机会，而要创造机会。', author: 'Abraham Lincoln' },
        { content: '人生最大的错误是不断担心会犯错。', author: 'Elbert Hubbard' },
        { content: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
        { content: '你的时间有限，不要浪费在重复别人的生活上。', author: 'Steve Jobs' },
        { content: '只有那些敢于相信自己内心深处有比现实更大力量的人，才能改变世界。', author: 'J.K. Rowling' },
      ]
      
      const quote = quotes[Math.floor(Math.random() * quotes.length)]
      
      return {
        output: [
          '💬 每日名言',
          '',
          `"${quote.content}"`,
          '',
          `— ${quote.author}`,
        ].join('\n')
      }
    }
  },
  description: '随机名言',
  usage: 'quote',
  examples: ['quote']
})

registerCommand('ipinfo', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      
      if (!response.ok) {
        throw new Error('查询失败')
      }
      
      const data = await response.json()
      
      return {
        output: [
          '🌐 本机IP信息',
          '',
          `IP地址: ${data.ip || '未知'}`,
          `国家: ${data.country_name || '未知'} (${data.country_code || ''})`,
          `地区: ${data.region || '未知'}`,
          `城市: ${data.city || '未知'}`,
          `邮政编码: ${data.postal || '未知'}`,
          `经纬度: ${data.latitude || ''}, ${data.longitude || ''}`,
          `时区: ${data.timezone || '未知'}`,
          `ISP: ${data.org || '未知'}`,
          `ASN: ${data.asn || '未知'}`,
          `网络: ${data.version === 'IPv6' ? 'IPv6' : 'IPv4'}`,
          '',
          '数据来源: ipapi.co',
        ].join('\n')
      }
    } catch {
      return {
        output: [
          '🌐 本机IP信息',
          '',
          '查询失败，无法获取IP信息',
          '',
          '提示: 可能是网络问题或API限制',
        ].join('\n')
      }
    }
  },
  description: 'IP地址信息',
  usage: 'ipinfo',
  examples: ['ipinfo']
})