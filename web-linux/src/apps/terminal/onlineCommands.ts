import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'
import { getCityInfo, weatherDescriptions } from './cityMap'

registerCommand('dictionary', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📖 词典查询',
          '',
          '用法: dictionary <单词>',
          '',
          '示例:',
          '  dictionary hello',
          '  dictionary computer',
          '  dictionary beautiful',
          '',
          '数据来源: DictionaryAPI (免费公开API)',
        ].join('\n')
      }
    }
    
    const word = args.join(' ')
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.dictionaryApi.baseUrl}/entries/en/${encodeURIComponent(word)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data || data.length === 0) {
        return { output: `dictionary: 未找到单词 '${word}'` }
      }
      
      const entry = data[0]
      const output: string[] = []
      
      output.push(`📖 ${entry.word}${entry.phonetic ? ` [${entry.phonetic}]` : ''}`)
      output.push('')
      
      if (entry.meanings) {
        entry.meanings.forEach((meaning: { partOfSpeech: string; definitions: any[] }) => {
          output.push(`${meaning.partOfSpeech || 'unknown'}:`)
          meaning.definitions.forEach((def: { definition: string; example?: string }, index: number) => {
            output.push(`  ${index + 1}. ${def.definition}`)
            if (def.example) {
              output.push(`     示例: "${def.example}"`)
            }
          })
          output.push('')
        })
      }
      
      output.push('数据来源: DictionaryAPI')
      
      return { output: output.join('\n') }
    } catch (error) {
      const fallbackDict: Record<string, { pos: string; definitions: { def: string; example?: string }[] }> = {
        'hello': { pos: 'interjection', definitions: [{ def: '用于问候或引起注意', example: 'Hello, how are you?' }] },
        'computer': { pos: 'noun', definitions: [{ def: '能够存储和处理数据的电子设备', example: 'I use my computer every day.' }] },
        'code': { pos: 'noun', definitions: [{ def: '编程中使用的指令集合', example: 'Writing code is fun.' }] },
        'program': { pos: 'noun', definitions: [{ def: '计算机执行的一组指令', example: 'This program helps with productivity.' }] },
        'internet': { pos: 'noun', definitions: [{ def: '连接全球计算机的网络', example: 'I surf the internet daily.' }] },
        'web': { pos: 'noun', definitions: [{ def: '万维网，互联网上的信息系统', example: 'The web has transformed how we live.' }] },
        'developer': { pos: 'noun', definitions: [{ def: '编写软件和应用程序的人', example: 'She is a skilled developer.' }] },
        'software': { pos: 'noun', definitions: [{ def: '计算机运行的程序和数据', example: 'Good software improves productivity.' }] },
      }
      
      const fallback = fallbackDict[word.toLowerCase()]
      
      if (fallback) {
        const output: string[] = []
        output.push(`📖 ${word}`)
        output.push('')
        output.push(`${fallback.pos}:`)
        fallback.definitions.forEach((def, index) => {
          output.push(`  ${index + 1}. ${def.def}`)
          if (def.example) {
            output.push(`     示例: "${def.example}"`)
          }
        })
        output.push('')
        output.push('提示: 使用本地词典')
        return { output: output.join('\n') }
      }
      
      return {
        output: [
          '📖 词典查询',
          '',
          handleApiError(error, '词典API'),
          '',
          '用法: dictionary <单词>',
        ].join('\n')
      }
    }
  },
  description: '查询英语单词释义',
  usage: 'dictionary <单词>',
  examples: ['dictionary hello', 'dictionary computer']
})

registerCommand('weather-forecast', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    const cityInfo = getCityInfo(city)
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&timezone=Asia/Shanghai&forecast_days=7`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      const output: string[] = []
      output.push(`🌤️  ${cityInfo.name} 7天天气预报`)
      output.push('')
      
      const days = ['今天', '明天', '后天', '第三天', '第四天', '第五天', '第六天']
      
      if (data.daily) {
        for (let i = 0; i < Math.min(7, data.daily.temperature_2m_max.length); i++) {
          const weatherCode = data.daily.weather_code[i] || 0
          const weatherDesc = weatherDescriptions[weatherCode] || '未知'
          const maxTemp = data.daily.temperature_2m_max[i]
          const minTemp = data.daily.temperature_2m_min[i]
          
          output.push(`${days[i]}:`)
          output.push(`  天气: ${weatherDesc}`)
          output.push(`  温度: ${minTemp}°C ~ ${maxTemp}°C`)
          
          if (data.daily.sunrise && data.daily.sunset) {
            const sunrise = new Date(data.daily.sunrise[i]).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            const sunset = new Date(data.daily.sunset[i]).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            output.push(`  日出: ${sunrise} | 日落: ${sunset}`)
          }
          output.push('')
        }
      }
      
      output.push('数据来源: Open-Meteo')
      
      return { output: output.join('\n') }
    } catch (error) {
      return {
        output: [
          `🌤️  ${cityInfo.name} 7天天气预报`,
          '',
          handleApiError(error, '天气预报'),
          '',
          '提示: 使用 weather 命令查看当前天气',
          '',
          '用法: weather-forecast [城市]',
          '示例: weather-forecast Beijing, weather-forecast Shanghai',
        ].join('\n')
      }
    }
  },
  description: '查询7天天气预报',
  usage: 'weather-forecast [城市]',
  examples: ['weather-forecast', 'weather-forecast Beijing']
})

registerCommand('crypto-history', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const coin = args[0]?.toLowerCase() || 'bitcoin'
    
    const coinMap: Record<string, string> = {
      'btc': 'bitcoin',
      'eth': 'ethereum',
      'sol': 'solana',
      'bnb': 'binancecoin',
      'xrp': 'ripple',
    }
    
    const coinId = coinMap[coin] || coin
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.coinGecko.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=7`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.prices || data.prices.length === 0) {
        return { output: `crypto-history: 未找到币种 '${coin}'` }
      }
      
      const output: string[] = []
      output.push(`📈 ${coinId.charAt(0).toUpperCase() + coinId.slice(1)} 7天价格走势`)
      output.push('')
      
      const sortedPrices = data.prices.sort((a: number[], b: number[]) => a[0] - b[0])
      const latestPrice = sortedPrices[sortedPrices.length - 1][1]
      const firstPrice = sortedPrices[0][1]
      const change = ((latestPrice - firstPrice) / firstPrice * 100)
      const changeStr = change.toFixed(2)
      
      output.push(`当前价格: $${latestPrice.toLocaleString()}`)
      output.push(`7天涨跌: ${change >= 0 ? '+' : ''}${changeStr}%`)
      output.push('')
      
      output.push('每日价格:')
      for (let i = 0; i < sortedPrices.length; i += Math.ceil(sortedPrices.length / 7)) {
        const date = new Date(sortedPrices[i][0])
        const price = sortedPrices[i][1]
        output.push(`  ${date.getMonth() + 1}/${date.getDate()}: $${price.toLocaleString()}`)
      }
      
      output.push('')
      output.push('数据来源: CoinGecko')
      
      return { output: output.join('\n') }
    } catch (error) {
      return {
        output: [
          `📈 ${coin} 7天价格走势`,
          '',
          handleApiError(error, '加密货币历史'),
          '',
          '提示: 使用 crypto 命令查看实时行情',
          '',
          '用法: crypto-history <币种>',
          '示例: crypto-history btc, crypto-history eth',
        ].join('\n')
      }
    }
  },
  description: '查看加密货币7天价格走势',
  usage: 'crypto-history <币种>',
  examples: ['crypto-history btc', 'crypto-history eth']
})

registerCommand('wiki', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ')
    
    if (!query) {
      return {
        output: [
          '📚 Wikipedia 搜索',
          '',
          '用法: wiki <关键词>',
          '',
          '示例:',
          '  wiki Linux',
          '  wiki Artificial Intelligence',
          '  wiki Python (programming language)',
          '',
          '数据来源: Wikipedia API',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.wikipedia.baseUrl}/search/title?q=${encodeURIComponent(query)}&limit=5&format=json`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.pages || data.pages.length === 0) {
        return { output: `wiki: 未找到关于 '${query}' 的结果` }
      }
      
      const output: string[] = []
      output.push('📚 Wikipedia 搜索结果')
      output.push('')
      
      data.pages.forEach((page: { title: string; description: string; thumbnail?: { source: string } }, index: number) => {
        output.push(`${index + 1}. ${page.title}`)
        if (page.description) {
          output.push(`   ${page.description}`)
        }
        output.push('')
      })
      
      output.push('提示: 这是摘要结果，完整内容请访问 Wikipedia')
      
      return { output: output.join('\n') }
    } catch (error) {
      const fallbackResults: Record<string, { title: string; desc: string }[]> = {
        'linux': [{ title: 'Linux', desc: 'Linux 是一种开源的类 Unix 操作系统内核，由 Linus Torvalds 创建于 1991 年。' }],
        'python': [{ title: 'Python (programming language)', desc: 'Python 是一种高级、通用、解释型的编程语言，以简洁的语法和强大的库生态系统著称。' }],
        'javascript': [{ title: 'JavaScript', desc: 'JavaScript 是一种轻量级的脚本语言，主要用于 Web 开发，支持面向对象、函数式和事件驱动编程。' }],
        'react': [{ title: 'React', desc: 'React 是由 Facebook 开发的用于构建用户界面的 JavaScript 库，采用组件化和虚拟 DOM 技术。' }],
        'github': [{ title: 'GitHub', desc: 'GitHub 是一个基于 Git 的代码托管平台，提供版本控制、协作和 CI/CD 功能。' }],
      }
      
      const key = Object.keys(fallbackResults).find(k => query.toLowerCase().includes(k))
      const results = key ? fallbackResults[key] : [{ title: query, desc: '暂无摘要信息，请访问 Wikipedia 获取更多内容。' }]
      
      const output: string[] = []
      output.push('📚 Wikipedia 搜索结果')
      output.push('')
      results.forEach((r, i) => {
        output.push(`${i + 1}. ${r.title}`)
        output.push(`   ${r.desc}`)
        output.push('')
      })
      output.push('提示: 使用离线数据')
      
      return { output: output.join('\n') }
    }
  },
  description: 'Wikipedia 搜索',
  usage: 'wiki <关键词>',
  examples: ['wiki Linux', 'wiki Python']
})

registerCommand('space', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.spaceflightNews.baseUrl}/articles?_limit=5`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      const output: string[] = []
      output.push('🚀 太空新闻')
      output.push('')
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      
      data.forEach((article: { title: string; summary: string; publishedAt: string; url: string }, index: number) => {
        output.push(`${index + 1}. ${article.title}`)
        if (article.summary) {
          const shortSummary = article.summary.length > 100 ? article.summary.substring(0, 100) + '...' : article.summary
          output.push(`   ${shortSummary}`)
        }
        if (article.publishedAt) {
          output.push(`   发布: ${new Date(article.publishedAt).toLocaleDateString('zh-CN')}`)
        }
        output.push('')
      })
      
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      output.push('数据来源: Spaceflight News API')
      
      return { output: output.join('\n') }
    } catch (error) {
      const fallbackNews = [
        { title: 'NASA 发布最新火星影像', summary: '火星探测器传回了令人惊叹的新图像，展示了红色星球的壮丽景观。', date: '2024-01-15' },
        { title: 'SpaceX 完成星舰试飞', summary: 'SpaceX 的星舰原型成功完成了又一次试飞任务，向火星殖民迈出重要一步。', date: '2024-01-14' },
        { title: '中国空间站新进展', summary: '中国空间站完成了多项科学实验，取得了重要成果。', date: '2024-01-13' },
        { title: '韦伯望远镜发现新星系', summary: '詹姆斯·韦伯太空望远镜发现了一个距离地球数十亿光年的古老星系。', date: '2024-01-12' },
      ]
      
      const output: string[] = []
      output.push('🚀 太空新闻')
      output.push('')
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      
      fallbackNews.forEach((news, index) => {
        output.push(`${index + 1}. ${news.title}`)
        output.push(`   ${news.summary}`)
        output.push(`   发布: ${news.date}`)
        output.push('')
      })
      
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      output.push(handleApiError(error, '太空新闻'))
      output.push('提示: 使用离线数据')
      
      return { output: output.join('\n') }
    }
  },
  description: '查看太空探索新闻',
  usage: 'space',
  examples: ['space']
})

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    const cityInfo = getCityInfo(city)
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia/Shanghai&forecast_days=1`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      const weatherCode = data.current?.weather_code || 0
      const weatherDesc = weatherDescriptions[weatherCode] || '未知'
      
      const output = [
        '🌤️  天气预报',
        '',
        `城市: ${cityInfo.name}`,
        '',
        `天气: ${weatherDesc}`,
        `温度: ${data.current?.temperature_2m || 'N/A'}°C`,
        `体感温度: ${data.current?.apparent_temperature || 'N/A'}°C`,
        `最高温度: ${data.daily?.temperature_2m_max?.[0] || 'N/A'}°C`,
        `最低温度: ${data.daily?.temperature_2m_min?.[0] || 'N/A'}°C`,
        '',
        `湿度: ${data.current?.relative_humidity_2m || 'N/A'}%`,
        `风速: ${data.current?.wind_speed_10m || 'N/A'} km/h`,
        '',
        `日出时间: ${data.daily?.sunrise?.[0] ? new Date(data.daily.sunrise[0]).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '未知'}`,
        `日落时间: ${data.daily?.sunset?.[0] ? new Date(data.daily.sunset[0]).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '未知'}`,
        '',
        '数据来源: Open-Meteo (免费公开API)',
      ]
      
      return { output: output.join('\n') }
    } catch (error) {
      const fallbackWeather: Record<string, { temp: number; desc: string; humidity: number; wind: number }> = {
        'beijing': { temp: 25, desc: '☀️ 晴朗', humidity: 45, wind: 12 },
        'shanghai': { temp: 28, desc: '⛅ 多云', humidity: 65, wind: 15 },
        'tokyo': { temp: 22, desc: '☁️ 阴天', humidity: 70, wind: 8 },
        'newyork': { temp: 20, desc: '☀️ 晴朗', humidity: 50, wind: 10 },
        'london': { temp: 15, desc: '🌧️ 小雨', humidity: 80, wind: 20 },
        'shenzhen': { temp: 30, desc: '⛅ 晴间多云', humidity: 75, wind: 18 },
        'hongkong': { temp: 29, desc: '🌦️ 阵雨', humidity: 82, wind: 25 },
        'paris': { temp: 18, desc: '☁️ 阴天', humidity: 68, wind: 12 },
        'sydney': { temp: 16, desc: '🌤️ 晴间多云', humidity: 55, wind: 15 },
        'dubai': { temp: 35, desc: '☀️ 晴朗', humidity: 40, wind: 22 },
      }
      
      const weather = fallbackWeather[city.toLowerCase()] || { temp: 20, desc: '未知', humidity: 50, wind: 10 }
      
      return {
        output: [
          '🌤️  天气预报',
          '',
          `城市: ${cityInfo.name}`,
          '',
          `天气: ${weather.desc}`,
          `温度: ${weather.temp}°C`,
          `体感温度: ${weather.temp - 2}°C`,
          `最高温度: ${weather.temp + 3}°C`,
          `最低温度: ${weather.temp - 5}°C`,
          '',
          `湿度: ${weather.humidity}%`,
          `风速: ${weather.wind} km/h`,
          '',
          handleApiError(error, '天气查询'),
          '提示: 使用离线备用数据',
          '',
          '用法: weather <城市名>',
          '示例: weather Beijing, weather Tokyo, weather 上海',
        ].join('\n')
      }
    }
  },
  description: '查询天气（基于 Open-Meteo 免费API）',
  usage: 'weather [城市]',
  examples: ['weather', 'weather Beijing', 'weather Shanghai', 'weather Tokyo']
})

registerCommand('news', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const source = args[0]?.toLowerCase() || 'hackernews'
    
    if (source === 'hackernews' || source === 'hn') {
      try {
        const topStoriesResponse = await fetchWithTimeout(`${API_CONFIG.hackerNews.baseUrl}/topstories.json`)
        if (!topStoriesResponse.ok) throw new Error('获取失败')
        
        const topStoryIds = await topStoriesResponse.json()
        const top10Ids = topStoryIds.slice(0, 10)
        
        const stories: any[] = []
        for (const id of top10Ids) {
          const storyResponse = await fetchWithTimeout(`${API_CONFIG.hackerNews.baseUrl}/item/${id}.json`)
          if (storyResponse.ok) {
            const story = await storyResponse.json()
            if (story && !story.deleted && !story.dead) {
              stories.push(story)
            }
          }
        }
        
        const output = [
          '📰 Hacker News Top Stories',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          ...stories.map((story, index) => 
            `${(index + 1).toString().padStart(2)}. ${story.title}\n     分数: ${story.score || 0} | 评论: ${story.descendants || 0}\n     来源: ${story.url ? new URL(story.url).hostname : 'Hacker News'}\n`
          ),
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '数据来源: Hacker News API',
          '',
          '用法: news [hackernews|hn]',
          '示例: news, news hn',
        ]
        
        return { output: output.join('\n') }
      } catch (error) {
        const fallbackNews = [
          { title: 'WebLinuxOS v38.0 正式发布，新增多项实用功能', score: 1234, comments: 256 },
          { title: 'AI技术持续发展，改变软件开发方式', score: 892, comments: 189 },
          { title: 'WebAssembly 性能大幅提升，Web应用迎来新机遇', score: 756, comments: 145 },
          { title: '开源社区活跃，贡献者数量创历史新高', score: 643, comments: 123 },
          { title: '云计算市场持续增长，边缘计算成为新热点', score: 589, comments: 98 },
          { title: 'React 19 发布，带来全新的并发特性', score: 1567, comments: 312 },
          { title: 'TypeScript 6.0 发布，性能大幅提升', score: 1123, comments: 234 },
          { title: 'WebGPU 标准正式发布，开启图形计算新篇章', score: 987, comments: 178 },
        ]
        
        return {
          output: [
            '📰 Hacker News Top Stories',
            '',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '',
            ...fallbackNews.map((news, index) => 
              `${(index + 1).toString().padStart(2)}. ${news.title}\n     分数: ${news.score} | 评论: ${news.comments}\n`
            ),
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '',
            handleApiError(error, 'Hacker News'),
            '提示: 使用离线备用数据',
          ].join('\n')
        }
      }
    }
    
    return {
      output: [
        '📰 新闻头条',
        '',
        '用法: news [来源]',
        '',
        '可用来源:',
        '  hackernews / hn - Hacker News 热门新闻',
        '',
        '示例:',
        '  news',
        '  news hn',
      ].join('\n')
    }
  },
  description: '显示新闻头条（基于 Hacker News 免费API）',
  usage: 'news [hackernews|hn]',
  examples: ['news', 'news hn']
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
          data.joke || (data.setup && data.delivery ? data.setup + '\n' + data.delivery : '暂无笑话'),
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

registerCommand('github', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const repo = args.join('/') || 'saya-ch/WebLinuxOS'
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.githubApi.baseUrl}/repos/${encodeURIComponent(repo)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          `📦 GitHub 仓库: ${data.full_name}`,
          '',
          `描述: ${data.description || '暂无描述'}`,
          `⭐ Stars: ${data.stargazers_count?.toLocaleString() || 0}`,
          `🍴 Forks: ${data.forks_count?.toLocaleString() || 0}`,
          `👀 关注: ${data.watchers_count?.toLocaleString() || 0}`,
          `🔄 开源协议: ${data.license?.name || '未指定'}`,
          `🐙 主分支: ${data.default_branch || 'main'}`,
          `📝 语言: ${data.language || '未知'}`,
          '',
          `创建时间: ${data.created_at ? new Date(data.created_at).toLocaleDateString('zh-CN') : '未知'}`,
          `更新时间: ${data.updated_at ? new Date(data.updated_at).toLocaleDateString('zh-CN') : '未知'}`,
          '',
          `主页: ${data.homepage || '暂无'}`,
          `仓库地址: ${data.html_url}`,
          '',
          '数据来源: GitHub API',
        ].join('\n')
      }
    } catch (error) {
      const fallbackRepos: Record<string, { stars: number; forks: number; description: string; language: string }> = {
        'saya-ch/weblinuxos': { stars: 1200, forks: 234, description: '基于Web的Linux桌面环境', language: 'TypeScript' },
        'facebook/react': { stars: 220000, forks: 45000, description: '用于构建用户界面的JavaScript库', language: 'JavaScript' },
        'vercel/next.js': { stars: 120000, forks: 25000, description: 'React框架', language: 'TypeScript' },
        'vuejs/core': { stars: 200000, forks: 30000, description: 'Vue.js核心库', language: 'TypeScript' },
      }
      
      const fallback = fallbackRepos[repo.toLowerCase()] || { stars: 0, forks: 0, description: '未知仓库', language: '未知' }
      
      return {
        output: [
          `📦 GitHub 仓库: ${repo}`,
          '',
          `描述: ${fallback.description}`,
          `⭐ Stars: ${fallback.stars.toLocaleString()}`,
          `🍴 Forks: ${fallback.forks.toLocaleString()}`,
          `📝 语言: ${fallback.language}`,
          '',
          handleApiError(error, 'GitHub API'),
          '提示: 使用离线备用数据',
          '',
          '用法: github <owner/repo>',
          '示例: github saya-ch/WebLinuxOS, github facebook/react',
        ].join('\n')
      }
    }
  },
  description: '查看GitHub仓库信息',
  usage: 'github [owner/repo]',
  examples: ['github', 'github saya-ch/WebLinuxOS', 'github facebook/react']
})

registerCommand('calendar', {
  handler: (): CommandResult => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const today = now.getDate()
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    let calendar = [
      `📅 ${year}年 ${monthNames[month]}`,
      '',
      `${'日'.padEnd(4)}${'一'.padEnd(4)}${'二'.padEnd(4)}${'三'.padEnd(4)}${'四'.padEnd(4)}${'五'.padEnd(4)}${'六'}`,
    ]
    
    let row = ''
    for (let i = 0; i < firstDay; i++) {
      row += '    '
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today
      const dayStr = isToday ? `[${day.toString().padStart(2, ' ')}]` : day.toString().padStart(2, ' ')
      row += dayStr.padEnd(4)
      
      if ((firstDay + day) % 7 === 0) {
        calendar.push(row)
        row = ''
      }
    }
    
    if (row) {
      calendar.push(row)
    }
    
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    
    calendar.push('')
    calendar.push(`今天: ${year}年${month + 1}月${today}日 ${weekdays[now.getDay()]}`)
    calendar.push(`本周是一年中的第 ${Math.ceil(now.getTime() / (7 * 24 * 60 * 60 * 1000))} 周`)
    
    return { output: calendar.join('\n') }
  },
  description: '显示日历',
  usage: 'calendar',
  examples: ['calendar']
})

registerCommand('battery', {
  handler: async (): Promise<CommandResult> => {
    const batteryApi = (navigator as any).getBattery
    if (!batteryApi) {
      return {
        output: [
          '🔋 电池状态',
          '',
          '您的浏览器不支持电池 API',
          '',
          '支持的浏览器: Chrome, Firefox, Edge',
        ].join('\n')
      }
    }
    
    try {
      const battery = await batteryApi()
      
      const status = battery.charging ? '🔌 充电中' : '🔋 放电中'
      const level = Math.round(battery.level * 100)
      const icon = level > 80 ? '⚡' : level > 50 ? '🔋' : level > 20 ? '🪫' : '🔴'
      
      const chargingTime = battery.chargingTime !== Infinity ? `${battery.chargingTime.toFixed(0)} 分钟` : '计算中'
      const dischargingTime = battery.dischargingTime !== Infinity ? `${(battery.dischargingTime / 60).toFixed(1)} 小时` : '计算中'
      
      return {
        output: [
          '🔋 电池状态',
          '',
          `${icon} 电量: ${level}%`,
          `状态: ${status}`,
          '',
          `预计充满时间: ${chargingTime}`,
          `预计剩余使用时间: ${dischargingTime}`,
          '',
          '数据来源: Battery API',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '🔋 电池状态',
          '',
          handleApiError(error, '电池API'),
          '',
          '提示: 某些浏览器可能需要HTTPS或特定权限',
        ].join('\n')
      }
    }
  },
  description: '查看电池状态',
  usage: 'battery',
  examples: ['battery']
})

registerCommand('cpu', {
  handler: (): CommandResult => {
    const cores = navigator.hardwareConcurrency || 4
    const userAgent = navigator.userAgent
    
    let platform = '未知平台'
    if (userAgent.includes('Windows')) platform = 'Windows'
    else if (userAgent.includes('Mac')) platform = 'macOS'
    else if (userAgent.includes('Linux')) platform = 'Linux'
    else if (userAgent.includes('Android')) platform = 'Android'
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS'
    
    const memory = (() => {
      try {
        const memoryInfo = (navigator as any).deviceMemory
        return memoryInfo ? `${memoryInfo} GB` : '未知'
      } catch {
        return '未知'
      }
    })()
    
    const output = [
      '💻 系统信息',
      '',
      `CPU 核心数: ${cores} 核`,
      `内存: ${memory}`,
      `平台: ${platform}`,
      `浏览器: ${navigator.appName} ${navigator.appVersion}`,
      `语言: ${navigator.language}`,
      '',
      '数据来源: Navigator API',
    ]
    
    return { output: output.join('\n') }
  },
  description: '查看系统硬件信息',
  usage: 'cpu',
  examples: ['cpu']
})

registerCommand('neofetch', {
  handler: (): CommandResult => {
    const distro = 'WebLinuxOS'
    const kernel = 'Web Kernel v38.0'
    const uptime = '刚刚启动'
    const packages = '100+'
    const shell = 'WebShell'
    const resolution = `${window.screen.width}x${window.screen.height}`
    const de = 'Web Desktop'
    const wm = 'WebWindowManager'
    const theme = 'Dark Mode'
    const icons = 'Lucide React'
    const terminal = 'WebTerminal'
    const cpu = `${navigator.hardwareConcurrency || 4} cores`
    
    const asciiArt = [
      '        _      __  __           _       ',
      '       | |    |  \\/  |         | |      ',
      '       | |    | \\  / | ___   __| | ___  ',
      '   _   | |    | |\\/| |/ _ \\ / _` |/ _ \\ ',
      '  | |__| |    | |  | | (_) | (_| |  __/ ',
      '   \\____/     |_|  |_|\\___/ \\__,_|\\___| ',
      '                                        ',
    ]
    
    const output = [
      ...asciiArt,
      '',
      `${distro} ${kernel}`,
      '',
      `-------------------`,
      '',
      `主机名: weblinuxos.local`,
      `操作系统: ${distro}`,
      `内核: ${kernel}`,
      `运行时间: ${uptime}`,
      `软件包: ${packages}`,
      `Shell: ${shell}`,
      `分辨率: ${resolution}`,
      `桌面环境: ${de}`,
      `窗口管理器: ${wm}`,
      `主题: ${theme}`,
      `图标: ${icons}`,
      `终端: ${terminal}`,
      `CPU: ${cpu}`,
      '',
      '-------------------',
      '',
      '欢迎使用 WebLinuxOS',
      '一个基于Web的完整Linux桌面环境',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示系统信息（仿 neofetch）',
  usage: 'neofetch',
  examples: ['neofetch']
})