import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    try {
      const { key, baseUrl } = API_CONFIG.openWeatherMap
      if (!key) {
        return {
          output: [
            '⚠️  错误: OpenWeatherMap API Key 未配置',
            '',
            '请在 .env 文件中配置:',
            '  VITE_OPENWEATHERMAP_API_KEY=your_key',
            '',
            '或使用天气应用查看（基于 Open-Meteo，无需 key）',
          ].join('\n')
        }
      }
      const response = await fetchWithTimeout(`${baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric&lang=zh_cn`)
      
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
      const { key, baseUrl } = API_CONFIG.newsApi
      if (!key) {
        return {
          output: [
            '⚠️  错误: NewsAPI Key 未配置',
            '',
            '请在 .env 文件中配置:',
            '  VITE_NEWSAPI_KEY=your_key',
            '',
            '或使用新闻阅读器应用查看 Hacker News',
          ].join('\n')
        }
      }
      const response = await fetchWithTimeout(`${baseUrl}/top-headlines?country=cn&apiKey=${key}&pageSize=10`)
      
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
      const response = await fetchWithTimeout(`${API_CONFIG.coinGecko.baseUrl}/coins/markets?vs_currency=usd&ids=bitcoin%2Cethereum%2Cbinancecoin%2Cripple%2Csolana%2Ccardano%2Cdogecoin%2Cusd-coin%2Cpolygon%2Cstaked-ether&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`)
      
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
      const response = await fetchWithTimeout(`${API_CONFIG.myMemory.baseUrl}/get?q=${encodeURIComponent(text)}&langpair=auto|zh-CN`)
      
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
      const response = await fetchWithTimeout(`${API_CONFIG.quotable.baseUrl}/random`)
      
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
      const response = await fetchWithTimeout('https://ipapi.co/json/')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
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
    } catch (error) {
      return {
        output: [
          '🌐 本机IP信息',
          '',
          handleApiError(error, 'IP查询'),
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

registerCommand('time', {
  handler: async (): Promise<CommandResult> => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
    const utcStr = now.toUTCString()
    
    return {
      output: [
        '⏰ 当前时间',
        '',
        `本地时间: ${timeStr}`,
        `日期: ${dateStr}`,
        `UTC时间: ${utcStr}`,
        `时间戳: ${Math.floor(now.getTime() / 1000)}`,
        `毫秒时间戳: ${now.getTime()}`,
      ].join('\n')
    }
  },
  description: '显示当前时间',
  usage: 'time',
  examples: ['time']
})

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const target = args[0]?.toUpperCase() || 'CNY'
    
    try {
      const response = await fetchWithTimeout(`https://api.frankfurter.app/latest?from=USD&to=${target}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.rates || !data.rates[target]) {
        return { output: `currency: 未找到货币 '${target}'` }
      }
      
      return {
        output: [
          '💱 汇率查询',
          '',
          `1 USD = ${data.rates[target]} ${target}`,
          `1 ${target} = ${(1 / data.rates[target]).toFixed(6)} USD`,
          '',
          `基准日期: ${data.date}`,
          '数据来源: Frankfurter API',
          '',
          '支持的货币代码: USD, EUR, GBP, JPY, CNY, AUD, CAD, CHF 等',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '💱 汇率查询',
          '',
          handleApiError(error, '汇率查询'),
          '',
          '用法: currency <货币代码>',
          '示例: currency CNY, currency EUR, currency JPY',
        ].join('\n')
      }
    }
  },
  description: '汇率查询',
  usage: 'currency [货币代码]',
  examples: ['currency', 'currency CNY', 'currency EUR']
})

registerCommand('country', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ')
    
    if (!query) {
      return {
        output: [
          '🌍 国家信息查询',
          '',
          '用法: country <国家名称或代码>',
          '示例: country China, country US, country JP',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.restCountries.baseUrl}/name/${encodeURIComponent(query)}?fullText=true`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!Array.isArray(data) || data.length === 0) {
        return { output: `country: 未找到国家 '${query}'` }
      }
      
      const country = data[0]
      
      return {
        output: [
          `🌍 ${country.name?.common || '未知'}`,
          '',
          `官方名称: ${country.name?.official || '未知'}`,
          `代码: ${country.cca2} / ${country.cca3}`,
          `首都: ${country.capital?.[0] || '未知'}`,
          `人口: ${country.population?.toLocaleString() || '未知'}`,
          `面积: ${country.area?.toLocaleString()} km²`,
          `时区: ${country.timezones?.[0] || '未知'}`,
          `语言: ${Object.values(country.languages || {}).join(', ') || '未知'}`,
          `货币: ${Object.keys(country.currencies || {}).join(', ') || '未知'}`,
          `所属大洲: ${country.continents?.join(', ') || '未知'}`,
          '',
          '数据来源: REST Countries API',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '🌍 国家信息查询',
          '',
          handleApiError(error, '国家信息'),
          '',
          '用法: country <国家名称或代码>',
          '示例: country China, country Japan',
        ].join('\n')
      }
    }
  },
  description: '查询国家信息',
  usage: 'country <国家名称>',
  examples: ['country China', 'country Japan', 'country US']
})

registerCommand('joke', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.jokeApi.baseUrl}/joke/Any?lang=zh&type=single`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          '😄 随机笑话',
          '',
          data.joke || data.setup + '\n' + data.delivery || '暂无笑话',
          '',
          `分类: ${data.category || '普通'}`,
          '数据来源: JokeAPI',
        ].join('\n')
      }
    } catch (error) {
      const fallbackJokes = [
        '为什么程序员不喜欢大自然？因为有太多的 bugs！',
        '计算机为什么会感冒？因为它有太多的 windows！',
        'JavaScript 程序员的口头禅：这在我的机器上是正常的！',
        '为什么数组喜欢聚会？因为它们喜欢在一起！',
        '为什么 CSS 总是那么冷静？因为它有很好的 padding！',
      ]
      
      return {
        output: [
          '😄 随机笑话',
          '',
          fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)],
          '',
          handleApiError(error, '笑话API'),
        ].join('\n')
      }
    }
  },
  description: '获取随机笑话',
  usage: 'joke',
  examples: ['joke']
})

registerCommand('advice', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.adviceSlip.baseUrl}/advice`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          '💡 每日建议',
          '',
          `"${data.slip?.advice || '暂无建议'}"`,
          '',
          `ID: #${data.slip?.id || 'unknown'}`,
          '数据来源: Advice Slip',
        ].join('\n')
      }
    } catch (error) {
      const fallbackAdvice = [
        '每天学习一点新知识，日积月累会有大收获。',
        '保持好奇心，这是创新的源泉。',
        '代码写得好不如代码读得好。',
        '休息好才能工作好，不要过度劳累。',
        '多与人交流，分享知识能让你学得更快。',
        '保持简洁，简单的解决方案往往是最好的。',
        '不要害怕犯错，每一次错误都是学习的机会。',
        '定期回顾你的代码，总会发现可以改进的地方。',
      ]
      
      return {
        output: [
          '💡 每日建议',
          '',
          `"${fallbackAdvice[Math.floor(Math.random() * fallbackAdvice.length)]}"`,
          '',
          handleApiError(error, '建议API'),
        ].join('\n')
      }
    }
  },
  description: '获取每日建议',
  usage: 'advice',
  examples: ['advice']
})