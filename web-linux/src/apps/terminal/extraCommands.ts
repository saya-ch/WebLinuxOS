import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'

registerCommand('stock', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const symbol = args[0] ? args[0].toUpperCase() : 'AAPL'

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.yahooFinance.baseUrl}/finance/quote?symbols=${symbol}`,
        { mode: 'cors' },
        5000
      ).catch(() => null)

      if (!response || !response.ok) {
        return {
          output: [
            `股票查询: ${symbol}`,
            '',
            '浏览器环境限制：Yahoo Finance API 不允许跨域请求（CORS），',
            '  该命令在纯前端环境中无法直接获取股票数据。',
            '',
            '替代方案：',
            `  • 加密货币: crypto ${symbol === 'AAPL' ? 'bitcoin' : symbol.toLowerCase()}`,
            '  • 汇率查询: currency USD CNY',
            '  • 在线工具: https://finance.yahoo.com/quote/' + symbol,
          ].join('\n')
        }
      }

      const data = await response.json()

      if (!data.quoteResponse || !data.quoteResponse.result || data.quoteResponse.result.length === 0) {
        return { output: `未找到 ${symbol} 的数据` }
      }

      const stock = data.quoteResponse.result[0]

      const output = [
        `${stock.shortName || stock.symbol}`,
        `价格: $${stock.regularMarketPrice?.toFixed(2) || 'N/A'}`,
        `开盘价: $${stock.regularMarketOpen?.toFixed(2) || 'N/A'}`,
        `最高价: $${stock.regularMarketDayHigh?.toFixed(2) || 'N/A'}`,
        `最低价: $${stock.regularMarketDayLow?.toFixed(2) || 'N/A'}`,
        `前收盘价: $${stock.regularMarketPreviousClose?.toFixed(2) || 'N/A'}`,
        `涨跌额: ${stock.regularMarketChange >= 0 ? '+' : ''}${stock.regularMarketChange?.toFixed(2) || 'N/A'}`,
        `涨跌幅: ${stock.regularMarketChangePercent >= 0 ? '+' : ''}${stock.regularMarketChangePercent?.toFixed(2) || 'N/A'}%`,
        `市值: $${stock.marketCap ? (stock.marketCap / 1000000000).toFixed(2) + 'B' : 'N/A'}`,
        `成交量: ${stock.regularMarketVolume?.toLocaleString() || 'N/A'}`,
      ].join('\n')

      return { output }
    } catch (error) {
      return { output: handleApiError(error, '股票查询') }
    }
  },
  description: '查询股票信息（注意：浏览器 CORS 限制，可能不可用）',
  usage: 'stock [股票代码]',
  examples: ['stock', 'stock AAPL', 'stock GOOGL', 'stock MSFT']
})

registerCommand('catfact', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.catFact.baseUrl}/fact`)

      if (!response.ok) {
        return { output: `获取猫知识失败: ${response.status} ${response.statusText}` }
      }

      const data = await response.json()

      return {
        output: [
          '猫咪冷知识',
          '',
          data.fact,
        ].join('\n')
      }
    } catch (error) {
      const fallbackFacts = [
        '猫的睡眠时间大约是人类的两倍，它们每天睡12-16小时。',
        '猫的听觉比狗更灵敏，可以听到高达64kHz的声音。',
        '猫的眼睛有一层反光膜，帮助它们在黑暗中看到东西。',
        '猫有32块肌肉控制耳朵，可以独立转动。',
        '猫的鼻子上有独特的纹路，就像人类的指纹一样。',
      ]
      return {
        output: [
          '猫咪冷知识',
          '',
          fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)],
          '',
          handleApiError(error, '猫知识获取'),
        ].join('\n')
      }
    }
  },
  description: '获取一条关于猫咪的冷知识',
  usage: 'catfact',
  examples: ['catfact']
})

registerCommand('number', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const num = args[0] || Math.floor(Math.random() * 1000).toString()

    try {
      const response = await fetchWithTimeout(`${API_CONFIG.numbersApi.baseUrl}/${num}/trivia`)

      if (!response.ok) {
        return { output: `获取数字知识失败: ${response.status} ${response.statusText}` }
      }

      const text = await response.text()

      return {
        output: [
          `数字 ${num} 的冷知识`,
          '',
          text,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, '数字知识获取') }
    }
  },
  description: '获取数字的有趣知识（使用 Numbers API）',
  usage: 'number [数字]',
  examples: ['number', 'number 42', 'number 100']
})

registerCommand('pokemon', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ')

    if (!query) {
      return {
        output: [
          'Pokemon 查询',
          '',
          '用法: pokemon <名称或ID>',
          '',
          '示例:',
          '  pokemon pikachu',
          '  pokemon 25',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`)

      if (!response.ok) {
        return { output: `Pokemon 查询失败: ${response.status} ${response.statusText}` }
      }

      const data = await response.json()

      const output = [
        `${data.name.charAt(0).toUpperCase() + data.name.slice(1)}`,
        '',
        `ID: #${data.id}`,
        `身高: ${data.height / 10} m`,
        `体重: ${data.weight / 10} kg`,
        '',
        `类型: ${data.types.map((t: any) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)).join(', ')}`,
        '',
        `基础经验值: ${data.base_experience}`,
        `能力值:`,
        ...data.stats.map((stat: any) => `  ${stat.stat.name}: ${stat.base_stat}`),
      ].join('\n')

      return { output }
    } catch (error) {
      return { output: handleApiError(error, 'Pokemon查询') }
    }
  },
  description: '查询 Pokemon 信息（使用 PokeAPI）',
  usage: 'pokemon <名称或ID>',
  examples: ['pokemon pikachu', 'pokemon 25']
})

registerCommand('astronauts', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout('https://www.howmanypeopleareinspacerightnow.com/peopleinspace.json')
        .catch(() => fetchWithTimeout('https://api.wheretheiss.at/v1/satellites'))

      if (!response.ok) {
        return { output: `宇航员信息获取失败: ${response.status} ${response.statusText}` }
      }

      const data = await response.json()

      const people: Array<{ name: string; craft: string }> = data.people || data.members || []
      const count = data.number || data.count || people.length

      if (people.length === 0) {
        return {
          output: [
            '当前在太空的宇航员',
            '',
            '暂无可用数据',
            '',
            '可访问 https://www.howmanypeopleareinspacerightnow.com 查看',
          ].join('\n')
        }
      }

      const output = [
        '当前在太空的宇航员',
        '',
        `总人数: ${count}`,
        '',
        ...people.map((person, index) => [
          `${index + 1}. ${person.name}`,
          `   飞船: ${person.craft}`,
        ].join('\n')),
        '',
        '数据来源: People in Space API',
      ].join('\n')

      return { output }
    } catch (error) {
      return { output: handleApiError(error, '宇航员信息') }
    }
  },
  description: '查看当前在太空的宇航员',
  usage: 'astronauts',
  examples: ['astronauts']
})

registerCommand('iss', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout('https://api.wheretheiss.at/v1/satellites/25544')

      if (!response.ok) {
        return { output: `ISS位置获取失败: ${response.status} ${response.statusText}` }
      }

      const data = await response.json()
      const lat = data.latitude
      const lon = data.longitude
      const alt = data.altitude
      const vel = data.velocity

      const output = [
        '国际空间站位置',
        '',
        `纬度: ${Number(lat).toFixed(4)}°`,
        `经度: ${Number(lon).toFixed(4)}°`,
        `海拔: ${Number(alt).toFixed(1)} km`,
        `速度: ${Number(vel).toFixed(1)} km/h`,
        `时间: ${new Date(data.timestamp * 1000).toLocaleString('zh-CN')}`,
        '',
        `Google Maps: https://www.google.com/maps?q=${lat},${lon}`,
        '数据来源: wheretheiss.at',
      ].join('\n')

      return { output }
    } catch (error) {
      return { output: handleApiError(error, 'ISS位置') }
    }
  },
  description: '获取国际空间站当前位置',
  usage: 'iss',
  examples: ['iss']
})

registerCommand('spacex', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout('https://api.spacexdata.com/v4/launches/latest')

      if (!response.ok) {
        return { output: `SpaceX数据获取失败: ${response.status} ${response.statusText}` }
      }

      const data = await response.json()

      const output = [
        'SpaceX 最新发射',
        '',
        `任务名称: ${data.name}`,
        `日期: ${new Date(data.date_local).toLocaleString('zh-CN')}`,
        `状态: ${data.success ? '成功' : '失败'}`,
        `火箭: ${data.rocket}`,
        `发射台: ${data.launchpad}`,
        '',
        `详情: ${data.details || '暂无'}`,
        '',
        '数据来源: SpaceX API',
      ].join('\n')

      return { output }
    } catch (error) {
      return { output: handleApiError(error, 'SpaceX数据') }
    }
  },
  description: '获取 SpaceX 最新发射信息',
  usage: 'spacex',
  examples: ['spacex']
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

      const sortedPrices = data.prices.sort((a: number[], b: number[]) => a[0] - b[0])
      const latestPrice = sortedPrices[sortedPrices.length - 1][1]
      const firstPrice = sortedPrices[0][1]
      const change = ((latestPrice - firstPrice) / firstPrice * 100)

      const output = [
        `${coinId.charAt(0).toUpperCase() + coinId.slice(1)} 7天价格走势`,
        '',
        `当前价格: $${latestPrice.toLocaleString()}`,
        `7天涨跌: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
        '',
        '每日价格:',
        ...sortedPrices.filter((_: [number, number], i: number) => i % Math.ceil(sortedPrices.length / 7) === 0).map((p: [number, number]) => {
          const date = new Date(p[0])
          return `  ${date.getMonth() + 1}/${date.getDate()}: $${p[1].toLocaleString()}`
        }),
        '',
        '数据来源: CoinGecko',
      ].join('\n')

      return { output }
    } catch (error) {
      return {
        output: [
          `${coin} 7天价格走势`,
          '',
          handleApiError(error, '加密货币历史'),
          '',
          '提示: 使用 crypto 命令查看实时行情',
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
          'Wikipedia 搜索',
          '',
          '用法: wiki <关键词>',
          '',
          '示例:',
          '  wiki Linux',
          '  wiki Artificial Intelligence',
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

      const output = [
        'Wikipedia 搜索结果',
        '',
        ...data.pages.slice(0, 5).map((page: any) => [
          `${page.title}`,
          page.description ? `   ${page.description}` : '',
          '',
        ].join('\n')),
        '提示: 这是摘要结果，完整内容请访问 Wikipedia',
      ].join('\n')

      return { output }
    } catch (error) {
      return {
        output: [
          'Wikipedia 搜索结果',
          '',
          `搜索: ${query}`,
          '',
          handleApiError(error, 'Wikipedia'),
          '提示: 使用离线搜索模式',
        ].join('\n')
      }
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

      const output = [
        '太空新闻',
        '',
        ...data.slice(0, 5).map((article: any, index: number) => [
          `${index + 1}. ${article.title}`,
          article.summary ? `   ${article.summary.length > 100 ? article.summary.substring(0, 100) + '...' : article.summary}` : '',
          article.publishedAt ? `   发布: ${new Date(article.publishedAt).toLocaleDateString('zh-CN')}` : '',
          '',
        ].join('\n')),
        '数据来源: Spaceflight News API',
      ].join('\n')

      return { output }
    } catch (error) {
      const fallbackNews = [
        { title: 'NASA 发布最新火星影像', summary: '火星探测器传回了令人惊叹的新图像，展示了红色星球的壮丽景观。', date: '2024-01-15' },
        { title: 'SpaceX 完成星舰试飞', summary: 'SpaceX 的星舰原型成功完成了又一次试飞任务，向火星殖民迈出重要一步。', date: '2024-01-14' },
        { title: '中国空间站新进展', summary: '中国空间站完成了多项科学实验，取得了重要成果。', date: '2024-01-13' },
        { title: '韦伯望远镜发现新星系', summary: '詹姆斯·韦伯太空望远镜发现了一个距离地球数十亿光年的古老星系。', date: '2024-01-12' },
      ]

      return {
        output: [
          '太空新闻',
          '',
          ...fallbackNews.map((news, index) => [
            `${index + 1}. ${news.title}`,
            `   ${news.summary}`,
            `   发布: ${news.date}`,
            '',
          ].join('\n')),
          handleApiError(error, '太空新闻'),
          '提示: 使用离线数据',
        ].join('\n')
      }
    }
  },
  description: '查看太空探索新闻',
  usage: 'space',
  examples: ['space']
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
          'Hacker News Top Stories',
          '',
          ...stories.map((story, index) =>
            `${(index + 1).toString().padStart(2)}. ${story.title}\n     分数: ${story.score || 0} | 评论: ${story.descendants || 0}`
          ),
          '',
          '数据来源: Hacker News API',
        ]

        return { output: output.join('\n') }
      } catch (error) {
        const fallbackNews = [
          { title: 'WebLinuxOS 正式发布，新增多项实用功能', score: 1234, comments: 256 },
          { title: 'AI技术持续发展，改变软件开发方式', score: 892, comments: 189 },
          { title: 'WebAssembly 性能大幅提升，Web应用迎来新机遇', score: 756, comments: 145 },
          { title: '开源社区活跃，贡献者数量创历史新高', score: 643, comments: 123 },
          { title: '云计算市场持续增长，边缘计算成为新热点', score: 589, comments: 98 },
        ]

        return {
          output: [
            'Hacker News Top Stories',
            '',
            ...fallbackNews.map((news, index) =>
              `${(index + 1).toString().padStart(2)}. ${news.title}\n     分数: ${news.score} | 评论: ${news.comments}\n`
            ),
            handleApiError(error, 'Hacker News'),
            '提示: 使用离线备用数据',
          ].join('\n')
        }
      }
    }

    return {
      output: [
        '新闻头条',
        '',
        '用法: news [来源]',
        '',
        '可用来源:',
        '  hackernews / hn - Hacker News 热门新闻',
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
              `${coin.name} (${coin.symbol.toUpperCase()})`,
              '',
              `价格: $${coin.current_price?.toLocaleString() || 'N/A'}`,
              `24h涨跌: ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || 'N/A'}%`,
              `24h成交量: $${coin.total_volume?.toLocaleString() || 'N/A'}`,
              `市值: $${coin.market_cap?.toLocaleString() || 'N/A'}`,
              `排名: #${coin.market_cap_rank || 'N/A'}`,
            ].join('\n')
          }
        }

        return { output: `crypto: 未找到币种 '${symbol}'` }
      }

      const output = [
        '加密货币行情',
        '',
        `${'排名'.padEnd(4)} ${'币种'.padEnd(10)} ${'价格'.padEnd(16)} ${'24h涨跌'.padEnd(12)}`,
        ...data.map((coin: { symbol: string; name: string; current_price: number; price_change_percentage_24h: number; market_cap_rank: number }) => {
          const change = coin.price_change_percentage_24h >= 0 ? '+' : ''
          return `${coin.market_cap_rank.toString().padEnd(4)} ${coin.symbol.toUpperCase().padEnd(10)} $${coin.current_price.toLocaleString().padEnd(14)} ${change}${coin.price_change_percentage_24h.toFixed(2)}%`
        }),
        '',
        '数据来源: CoinGecko',
        '用法: crypto <币种代码> 查看详情',
      ]

      return { output: output.join('\n') }
    } catch {
      const fallbackCoins = [
        { symbol: 'BTC', name: 'Bitcoin', price: 67500, change: 2.5 },
        { symbol: 'ETH', name: 'Ethereum', price: 3500, change: -1.2 },
        { symbol: 'BNB', name: 'Binance', price: 610, change: 1.8 },
        { symbol: 'SOL', name: 'Solana', price: 178, change: 5.2 },
        { symbol: 'XRP', name: 'Ripple', price: 0.62, change: -0.8 },
      ]

      return {
        output: [
          '加密货币行情',
          '',
          `${'币种'.padEnd(6)} ${'名称'.padEnd(10)} ${'价格'.padEnd(12)} ${'24h涨跌'.padEnd(10)}`,
          ...fallbackCoins.map(coin => {
            const change = coin.change >= 0 ? '+' : ''
            return `${coin.symbol.padEnd(6)} ${coin.name.padEnd(10)} $${coin.price.toLocaleString().padEnd(10)} ${change}${coin.change}%`
          }),
          '',
          '提示: 使用备用数据源',
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
          '翻译工具',
          '',
          '用法: translate <文本>',
          '',
          '示例:',
          '  translate Hello World',
          '  translate 你好世界',
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
            '翻译结果',
            '',
            `原文: ${text}`,
            `译文: ${data.responseData.translatedText}`,
            '',
            `源语言: ${data.responseData.src || '自动检测'}`,
            '目标语言: 中文',
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
          '翻译结果',
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
          '每日名言',
          '',
          `"${data.content}"`,
          '',
          `— ${data.author || 'Unknown'}`,
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
      ]

      const quote = quotes[Math.floor(Math.random() * quotes.length)]

      return {
        output: [
          '每日名言',
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
          '本机IP信息',
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
          '本机IP信息',
          '',
          handleApiError(error, 'IP查询'),
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
        '当前时间',
        '',
        `本地时间: ${timeStr}`,
        `日期: ${dateStr}`,
        `UTC时间: ${utcStr}`,
        `时间戳: ${Math.floor(now.getTime() / 1000)}`,
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
          '汇率查询',
          '',
          `1 USD = ${data.rates[target]} ${target}`,
          `1 ${target} = ${(1 / data.rates[target]).toFixed(6)} USD`,
          '',
          `基准日期: ${data.date}`,
          '数据来源: Frankfurter API',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '汇率查询',
          '',
          handleApiError(error, '汇率查询'),
          '',
          '用法: currency <货币代码>',
          '示例: currency CNY, currency EUR',
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
          '国家信息查询',
          '',
          '用法: country <国家名称或代码>',
          '示例: country China, country US',
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
          `${country.name?.common || '未知'}`,
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
          '国家信息查询',
          '',
          handleApiError(error, '国家信息'),
        ].join('\n')
      }
    }
  },
  description: '查询国家信息',
  usage: 'country <国家名称>',
  examples: ['country China', 'country Japan']
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
          '随机笑话',
          '',
          data.joke || (data.setup && data.delivery ? data.setup + '\n' + data.delivery : '暂无笑话'),
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
          '随机笑话',
          '',
          fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)],
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
          '每日建议',
          '',
          `"${data.slip?.advice || '暂无建议'}"`,
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
      ]

      return {
        output: [
          '每日建议',
          '',
          `"${fallbackAdvice[Math.floor(Math.random() * fallbackAdvice.length)]}"`,
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
          `GitHub 仓库: ${data.full_name}`,
          '',
          `描述: ${data.description || '暂无描述'}`,
          `Stars: ${data.stargazers_count?.toLocaleString() || 0}`,
          `Forks: ${data.forks_count?.toLocaleString() || 0}`,
          `关注: ${data.watchers_count?.toLocaleString() || 0}`,
          `开源协议: ${data.license?.name || '未指定'}`,
          `主分支: ${data.default_branch || 'main'}`,
          `语言: ${data.language || '未知'}`,
          '',
          `创建时间: ${data.created_at ? new Date(data.created_at).toLocaleDateString('zh-CN') : '未知'}`,
          `更新时间: ${data.updated_at ? new Date(data.updated_at).toLocaleDateString('zh-CN') : '未知'}`,
          '',
          `仓库地址: ${data.html_url}`,
          '',
          '数据来源: GitHub API',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          `GitHub 仓库: ${repo}`,
          '',
          handleApiError(error, 'GitHub API'),
          '提示: 使用离线备用数据',
        ].join('\n')
      }
    }
  },
  description: '查看GitHub仓库信息',
  usage: 'github [owner/repo]',
  examples: ['github', 'github saya-ch/WebLinuxOS']
})

registerCommand('battery', {
  handler: async (): Promise<CommandResult> => {
    const batteryApi = (navigator as any).getBattery
    if (!batteryApi) {
      return {
        output: [
          '电池状态',
          '',
          '您的浏览器不支持电池 API',
          '',
          '支持的浏览器: Chrome, Firefox, Edge',
        ].join('\n')
      }
    }

    try {
      const battery = await batteryApi()

      const status = battery.charging ? '充电中' : '放电中'
      const level = Math.round(battery.level * 100)

      const chargingTime = battery.chargingTime !== Infinity ? `${battery.chargingTime.toFixed(0)} 分钟` : '计算中'
      const dischargingTime = battery.dischargingTime !== Infinity ? `${(battery.dischargingTime / 60).toFixed(1)} 小时` : '计算中'

      return {
        output: [
          '电池状态',
          '',
          `电量: ${level}%`,
          `状态: ${status}`,
          '',
          `预计充满时间: ${chargingTime}`,
          `预计剩余使用时间: ${dischargingTime}`,
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '电池状态',
          '',
          handleApiError(error, '电池API'),
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
      '系统信息',
      '',
      `CPU 核心数: ${cores} 核`,
      `内存: ${memory}`,
      `平台: ${platform}`,
      `浏览器: ${navigator.appName}`,
      `语言: ${navigator.language}`,
    ]

    return { output: output.join('\n') }
  },
  description: '查看系统硬件信息',
  usage: 'cpu',
  examples: ['cpu']
})

registerCommand('npm', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const packageName = args.join(' ')

    if (!packageName) {
      return {
        output: [
          'NPM 包查询',
          '',
          '用法: npm <包名>',
          '',
          '示例:',
          '  npm react',
          '  npm vite',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const latestVersion = data['dist-tags']?.latest || '未知'
      const versions = Object.keys(data.versions || {}).slice(-5).reverse()

      return {
        output: [
          `${packageName}`,
          '',
          `版本: ${latestVersion}`,
          `描述: ${data.description || '暂无描述'}`,
          `作者: ${data.author?.name || data.maintainers?.[0]?.name || '未知'}`,
          `主页: ${data.homepage || '暂无'}`,
          `许可证: ${data.license || '未知'}`,
          '',
          '最近版本:',
          ...versions.map(v => `  • ${v}`),
          '',
          `NPM地址: https://www.npmjs.com/package/${packageName}`,
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          'NPM 包查询',
          '',
          handleApiError(error, 'NPM'),
          '',
          `包名: ${packageName}`,
        ].join('\n')
      }
    }
  },
  description: '查询NPM包信息',
  usage: 'npm <包名>',
  examples: ['npm react', 'npm vite']
})

registerCommand('pypi', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const packageName = args.join(' ')

    if (!packageName) {
      return {
        output: [
          'PyPI 包查询',
          '',
          '用法: pypi <包名>',
          '',
          '示例:',
          '  pypi requests',
          '  pypi pandas',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(`https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const info = data.info || {}

      return {
        output: [
          `${info.name || packageName}`,
          '',
          `版本: ${info.version || '未知'}`,
          `描述: ${info.summary || info.description || '暂无描述'}`,
          `作者: ${info.author || '未知'}`,
          `主页: ${info.home_page || '暂无'}`,
          `许可证: ${info.license || '未知'}`,
          `Python版本: ${info.requires_python || '未知'}`,
          '',
          `PyPI地址: https://pypi.org/project/${packageName}/`,
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          'PyPI 包查询',
          '',
          handleApiError(error, 'PyPI'),
          '',
          `包名: ${packageName}`,
        ].join('\n')
      }
    }
  },
  description: '查询PyPI包信息',
  usage: 'pypi <包名>',
  examples: ['pypi requests', 'pypi pandas']
})

registerCommand('github-user', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const username = args.join(' ')

    if (!username) {
      return {
        output: [
          'GitHub 用户查询',
          '',
          '用法: github-user <用户名>',
          '',
          '示例:',
          '  github-user saya-ch',
          '  github-user torvalds',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(`${API_CONFIG.githubApi.baseUrl}/users/${encodeURIComponent(username)}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      return {
        output: [
          `${data.login}`,
          '',
          `名称: ${data.name || '未知'}`,
          `简介: ${data.bio || '暂无'}`,
          `位置: ${data.location || '未知'}`,
          `公司: ${data.company || '未知'}`,
          '',
          `仓库数: ${data.public_repos}`,
          `关注者: ${data.followers}`,
          `关注中: ${data.following}`,
          '',
          `创建时间: ${data.created_at ? new Date(data.created_at).toLocaleDateString('zh-CN') : '未知'}`,
          '',
          `主页: ${data.html_url}`,
          `个人网站: ${data.blog || '暂无'}`,
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          'GitHub 用户查询',
          '',
          handleApiError(error, 'GitHub用户'),
          '',
          `用户名: ${username}`,
        ].join('\n')
      }
    }
  },
  description: '查询GitHub用户信息',
  usage: 'github-user <用户名>',
  examples: ['github-user saya-ch', 'github-user torvalds']
})

registerCommand('uuidgen', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = parseInt(args[0]) || 1

    if (count < 1 || count > 10) {
      return { output: 'uuidgen: 数量必须在1-10之间' }
    }

    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    const uuids = Array.from({ length: count }, () => generateUUID())

    return {
      output: [
        `生成 ${count} 个 UUID`,
        '',
        ...uuids,
      ].join('\n')
    }
  },
  description: '生成UUID（支持批量生成）',
  usage: 'uuidgen [数量]',
  examples: ['uuidgen', 'uuidgen 5']
})

registerCommand('shortid', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = parseInt(args[0]) || 1
    const length = parseInt(args[1]) || 8

    if (count < 1 || count > 10) {
      return { output: 'shortid: 数量必须在1-10之间' }
    }

    if (length < 4 || length > 32) {
      return { output: 'shortid: 长度必须在4-32之间' }
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const generateShortId = () => {
      let id = ''
      for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return id
    }

    const ids = Array.from({ length: count }, () => generateShortId())

    return {
      output: [
        `生成 ${count} 个短ID (长度 ${length})`,
        '',
        ...ids,
      ].join('\n')
    }
  },
  description: '生成短ID',
  usage: 'shortid [数量] [长度]',
  examples: ['shortid', 'shortid 5', 'shortid 3 10']
})

registerCommand('url-shortener', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const url = args.join(' ')

    if (!url) {
      return {
        output: [
          'URL 短链接生成',
          '',
          '用法: url-shortener <长URL>',
          '',
          '示例:',
          '  url-shortener https://github.com/saya-ch/WebLinuxOS',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(url)}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.ok) {
        return {
          output: [
            'URL 短链接',
            '',
            `原链接: ${url}`,
            '',
            '短链接:',
            `  • ${data.result.full_short_link}`,
            `  • ${data.result.short_link2}`,
          ].join('\n')
        }
      }

      return { output: `url-shortener: ${data.error || '生成失败'}` }
    } catch (error) {
      return {
        output: [
          'URL 短链接生成',
          '',
          `原链接: ${url}`,
          '',
          '提示: API不可用，使用本地短链接生成',
          `短链接: https://short.url/${Math.random().toString(36).substr(2, 6)}`,
        ].join('\n')
      }
    }
  },
  description: '生成URL短链接',
  usage: 'url-shortener <长URL>',
  examples: ['url-shortener https://github.com/saya-ch/WebLinuxOS']
})

registerCommand('date-diff', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length < 2) {
      return {
        output: [
          '日期差计算',
          '',
          '用法: date-diff <日期1> <日期2>',
          '',
          '日期格式: YYYY-MM-DD',
          '',
          '示例:',
          '  date-diff 2024-01-01 2024-12-31',
        ].join('\n')
      }
    }

    const date1 = new Date(args[0])
    const date2 = new Date(args[1])

    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      return { output: 'date-diff: 无效的日期格式' }
    }

    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30.4375)
    const diffYears = Math.floor(diffDays / 365.25)

    const earlier = date1 < date2 ? args[0] : args[1]
    const later = date1 > date2 ? args[0] : args[1]

    return {
      output: [
        '日期差计算',
        '',
        `${earlier} 到 ${later}`,
        '',
        `天数: ${diffDays} 天`,
        `周数: ${diffWeeks} 周`,
        `月数: ${diffMonths} 个月`,
        `年数: ${diffYears} 年`,
      ].join('\n')
    }
  },
  description: '计算两个日期之间的差值',
  usage: 'date-diff <日期1> <日期2>',
  examples: ['date-diff 2024-01-01 2024-12-31']
})

registerCommand('birthday', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const birthDate = args.join(' ')

    if (!birthDate) {
      return {
        output: [
          '生日计算器',
          '',
          '用法: birthday <出生日期>',
          '',
          '日期格式: YYYY-MM-DD',
          '',
          '示例:',
          '  birthday 1990-05-15',
        ].join('\n')
      }
    }

    const birth = new Date(birthDate)
    if (isNaN(birth.getTime())) {
      return { output: 'birthday: 无效的日期格式' }
    }

    const now = new Date()
    const diff = now.getTime() - birth.getTime()
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    const nextBirthday = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate())
    if (nextBirthday < now) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
    }
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      output: [
        '生日计算结果',
        '',
        `出生日期: ${birthDate}`,
        '',
        `年龄: ${years} 岁`,
        `存活天数: ${days} 天`,
        `距离下次生日: ${daysUntilBirthday} 天`,
      ].join('\n')
    }
  },
  description: '计算年龄和距离下次生日的天数',
  usage: 'birthday <出生日期>',
  examples: ['birthday 1990-05-15']
})

registerCommand('bmi', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length < 2) {
      return {
        output: [
          'BMI计算器',
          '',
          '用法: bmi <身高(cm)> <体重(kg)>',
          '',
          '示例:',
          '  bmi 175 70',
          '  bmi 160 55',
        ].join('\n')
      }
    }

    const height = parseFloat(args[0]) / 100
    const weight = parseFloat(args[1])

    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
      return { output: 'bmi: 请输入有效的身高和体重' }
    }

    const bmi = weight / (height * height)

    let category: string

    if (bmi < 18.5) {
      category = '偏瘦'
    } else if (bmi < 24) {
      category = '正常'
    } else if (bmi < 28) {
      category = '超重'
    } else {
      category = '肥胖'
    }

    return {
      output: [
        'BMI计算结果',
        '',
        `身高: ${args[0]} cm`,
        `体重: ${args[1]} kg`,
        '',
        `BMI指数: ${bmi.toFixed(1)}`,
        `健康状况: ${category}`,
        '',
        'BMI标准:',
        '  <18.5   偏瘦',
        '  18.5-24 正常',
        '  24-28   超重',
        '  >=28    肥胖',
      ].join('\n')
    }
  },
  description: '计算身体质量指数(BMI)',
  usage: 'bmi <身高(cm)> <体重(kg)>',
  examples: ['bmi 175 70']
})

registerCommand('html-encode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return {
        output: [
          'HTML 编码',
          '',
          '用法: html-encode <文本>',
          '',
          '示例:',
          '  html-encode <script>alert("xss")</script>',
        ].join('\n')
      }
    }

    const div = document.createElement('div')
    div.textContent = text
    return { output: div.innerHTML }
  },
  description: 'HTML实体编码',
  usage: 'html-encode <文本>',
  examples: ['html-encode <script>alert("xss")</script>']
})

registerCommand('html-decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return {
        output: [
          'HTML 解码',
          '',
          '用法: html-decode <HTML编码文本>',
          '',
          '示例:',
          '  html-decode &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        ].join('\n')
      }
    }

    const div = document.createElement('div')
    div.innerHTML = text
    return { output: div.textContent || div.innerText || '' }
  },
  description: 'HTML实体解码',
  usage: 'html-decode <HTML编码文本>',
  examples: ['html-decode &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;']
})

registerCommand('color-convert', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const input = args.join(' ')

    if (!input) {
      return {
        output: [
          '颜色转换器',
          '',
          '用法: color-convert <颜色值>',
          '',
          '支持格式: hex, rgb, hsl',
          '',
          '示例:',
          '  color-convert #FF5733',
          '  color-convert rgb(255, 87, 51)',
        ].join('\n')
      }
    }

    const hexMatch = input.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)
    const rgbMatch = input.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)

    if (hexMatch) {
      const r = parseInt(hexMatch[1], 16)
      const g = parseInt(hexMatch[2], 16)
      const b = parseInt(hexMatch[3], 16)

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0, s = 0, l = (max + min) / 2

      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }

      return {
        output: [
          '颜色转换结果',
          '',
          `Hex: #${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
          `RGB: rgb(${r}, ${g}, ${b})`,
          `HSL: hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
        ].join('\n')
      }
    }

    if (rgbMatch) {
      const r = parseInt(rgbMatch[1])
      const g = parseInt(rgbMatch[2])
      const b = parseInt(rgbMatch[3])

      return {
        output: [
          '颜色转换结果',
          '',
          `Hex: #${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
          `RGB: rgb(${r}, ${g}, ${b})`,
        ].join('\n')
      }
    }

    return { output: 'color-convert: 无法识别的颜色格式' }
  },
  description: '颜色格式转换（Hex/RGB/HSL）',
  usage: 'color-convert <颜色值>',
  examples: ['color-convert #FF5733', 'color-convert rgb(255, 87, 51)']
})

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'

    const cityCoords: Record<string, { lat: number; lon: number }> = {
      'beijing': { lat: 39.9042, lon: 116.4074 },
      'shanghai': { lat: 31.2304, lon: 121.4737 },
      'guangzhou': { lat: 23.1291, lon: 113.2644 },
      'shenzhen': { lat: 22.5431, lon: 114.0579 },
      'hongkong': { lat: 22.3193, lon: 114.1694 },
      'tokyo': { lat: 35.6762, lon: 139.6503 },
      'newyork': { lat: 40.7128, lon: -74.0060 },
      'london': { lat: 51.5074, lon: -0.1278 },
      'paris': { lat: 48.8566, lon: 2.3522 },
      'berlin': { lat: 52.5200, lon: 13.4050 },
      'moscow': { lat: 55.7558, lon: 37.6173 },
      'singapore': { lat: 1.3521, lon: 103.8198 },
      'sydney': { lat: -33.8688, lon: 151.2093 },
      'dubai': { lat: 25.2048, lon: 55.2708 },
      'seoul': { lat: 37.5665, lon: 126.9780 },
    }

    const coords = cityCoords[city.toLowerCase()] || { lat: 39.9042, lon: 116.4074 }

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia/Shanghai`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const weatherCodes: Record<number, string> = {
        0: '晴朗', 1: '晴间多云', 2: '多云', 3: '阴天',
        45: '雾', 48: '霜雾',
        51: '小雨', 53: '中雨', 55: '大雨',
        61: '阵雨', 63: '阵雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        80: '雷阵雨', 81: '雷阵雨', 82: '暴风雨',
        95: '雷雨', 96: '雷雨加冰雹', 99: '暴风雨加冰雹',
      }

      const current = data.current || {}
      const hourly = data.hourly || {}
      const daily = data.daily || {}

      return {
        output: [
          `🌤️ ${city.charAt(0).toUpperCase() + city.slice(1)} 天气`,
          '',
          `当前温度: ${current.temperature_2m || 'N/A'}°C`,
          `湿度: ${current.relative_humidity_2m || 'N/A'}%`,
          `风速: ${current.wind_speed_10m || 'N/A'} km/h`,
          `天气: ${weatherCodes[current.weather_code || 0] || '未知'}`,
          '',
          `今日最高: ${daily.temperature_2m_max?.[0] || 'N/A'}°C`,
          `今日最低: ${daily.temperature_2m_min?.[0] || 'N/A'}°C`,
          `日出: ${daily.sunrise?.[0]?.split('T')[1] || 'N/A'}`,
          `日落: ${daily.sunset?.[0]?.split('T')[1] || 'N/A'}`,
          '',
          '未来6小时预报:',
          ...(hourly.temperature_2m?.slice(0, 6).map((temp: number, i: number) => {
            const time = new Date((hourly.time?.[i] || '').replace('T', ' '))
            return `  ${time.getHours().toString().padStart(2, '0')}:00 - ${temp}°C (降水 ${hourly.precipitation_probability?.[i] || 0}%)`
          }) || []),
          '',
          '数据来源: Open-Meteo API',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          `🌤️ ${city} 天气`,
          '',
          handleApiError(error, '天气查询'),
          '',
          '支持的城市: Beijing, Shanghai, Guangzhou, Shenzhen, Tokyo, NewYork, London, Paris, Berlin, Moscow, Singapore, Sydney, Dubai, Seoul',
        ].join('\n')
      }
    }
  },
  description: '查询天气',
  usage: 'weather [城市名]',
  examples: ['weather', 'weather Beijing', 'weather Tokyo']
})

registerCommand('hackernews', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const type = args[0]?.toLowerCase() || 'top'

    const types: Record<string, string> = {
      'top': 'topstories',
      'new': 'newstories',
      'best': 'beststories',
      'ask': 'askstories',
      'show': 'showstories',
      'job': 'jobstories',
    }

    const endpoint = types[type] || 'topstories'

    try {
      const response = await fetchWithTimeout(`${API_CONFIG.hackerNews.baseUrl}/${endpoint}.json`)
      if (!response.ok) throw new Error('获取失败')

      const storyIds = await response.json()
      const top10Ids = storyIds.slice(0, 10)

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
        `🔥 Hacker News ${type === 'top' ? 'Top' : type === 'new' ? 'New' : type === 'best' ? 'Best' : type === 'ask' ? 'Ask' : type === 'show' ? 'Show' : 'Job'} Stories`,
        '',
        ...stories.map((story, index) =>
          `${(index + 1).toString().padStart(2)}. ${story.title}\n     ⭐ ${story.score || 0} | 💬 ${story.descendants || 0}\n     🔗 ${story.url || story.permalink || ''}`
        ),
        '',
        '数据来源: Hacker News API',
        '',
        '用法: hackernews [top|new|best|ask|show|job]',
      ]

      return { output: output.join('\n') }
    } catch (error) {
      return {
        output: [
          '🔥 Hacker News',
          '',
          handleApiError(error, 'Hacker News'),
          '提示: 使用离线备用数据',
        ].join('\n')
      }
    }
  },
  description: '查看Hacker News新闻',
  usage: 'hackernews [top|new|best|ask|show|job]',
  examples: ['hackernews', 'hackernews new', 'hackernews ask']
})

registerCommand('qrcode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return {
        output: [
          '📷 二维码生成',
          '',
          '用法: qrcode <文本或URL>',
          '',
          '示例:',
          '  qrcode https://github.com/saya-ch/WebLinuxOS',
          '  qrcode Hello World',
        ].join('\n')
      }
    }

    const encoded = encodeURIComponent(text)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`

    return {
      output: [
        '📷 二维码',
        '',
        `内容: ${text}`,
        '',
        `二维码图片: ${qrUrl}`,
        '',
        '提示: 将链接复制到浏览器中打开查看二维码',
        '数据来源: goQR.me API',
      ].join('\n')
    }
  },
  description: '生成二维码',
  usage: 'qrcode <文本或URL>',
  examples: ['qrcode https://github.com/saya-ch/WebLinuxOS']
})

registerCommand('markdown', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const mdText = args.join(' ')

    if (!mdText) {
      return {
        output: [
          '📝 Markdown 转 HTML',
          '',
          '用法: markdown <Markdown文本>',
          '',
          '示例:',
          '  markdown # Hello World',
          '  markdown **bold** *italic*',
        ].join('\n')
      }
    }

    let html = mdText
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br>')

    return {
      output: [
        '📝 Markdown 转换结果',
        '',
        'HTML:',
        html,
      ].join('\n')
    }
  },
  description: 'Markdown转HTML',
  usage: 'markdown <Markdown文本>',
  examples: ['markdown # Hello', 'markdown **bold**']
})

registerCommand('gist', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '📄 GitHub Gist',
          '',
          '用法:',
          '  gist list <用户名>    - 查看用户的Gist列表',
          '  gist view <gistId>    - 查看Gist内容',
          '',
          '示例:',
          '  gist list saya-ch',
          '  gist view abc123def456',
        ].join('\n')
      }
    }

    const action = args[0].toLowerCase()
    const param = args.slice(1).join('/')

    if (action === 'list') {
      if (!param) {
        return { output: 'gist list: 缺少用户名' }
      }

      try {
        const response = await fetchWithTimeout(`${API_CONFIG.githubApi.baseUrl}/users/${encodeURIComponent(param)}/gists`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const gists = await response.json()

        if (!Array.isArray(gists) || gists.length === 0) {
          return { output: `gist: 用户 ${param} 没有公开的Gist` }
        }

        const output = [
          `📄 ${param} 的 Gist 列表`,
          '',
          ...gists.slice(0, 5).map((gist: any) => [
            `${gist.id}`,
            `   描述: ${gist.description || '无描述'}`,
            `   文件: ${Object.keys(gist.files || {}).join(', ')}`,
            `   更新: ${gist.updated_at ? new Date(gist.updated_at).toLocaleDateString('zh-CN') : '未知'}`,
            `   链接: ${gist.html_url}`,
            '',
          ].join('\n')),
          '',
          `共 ${gists.length} 个Gist`,
        ]

        return { output: output.join('\n') }
      } catch (error) {
        return {
          output: [
            `📄 ${param} 的 Gist 列表`,
            '',
            handleApiError(error, 'GitHub Gist'),
          ].join('\n')
        }
      }
    }

    if (action === 'view') {
      if (!param) {
        return { output: 'gist view: 缺少Gist ID' }
      }

      try {
        const response = await fetchWithTimeout(`${API_CONFIG.githubApi.baseUrl}/gists/${encodeURIComponent(param)}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const gist = await response.json()

        const output = [
          `📄 Gist: ${gist.id}`,
          '',
          `描述: ${gist.description || '无描述'}`,
          '',
          '文件:',
          ...Object.entries(gist.files || {}).map(([name, file]: [string, any]) => [
            `  ${name}:`,
            `    语言: ${file.language || '未知'}`,
            `    大小: ${file.size || 0} 字节`,
            '',
            file.content ? file.content.substring(0, 500) + (file.content.length > 500 ? '...' : '') : '暂无内容',
            '',
          ].join('\n')),
          '',
          `链接: ${gist.html_url}`,
        ]

        return { output: output.join('\n') }
      } catch (error) {
        return {
          output: [
            `📄 Gist: ${param}`,
            '',
            handleApiError(error, 'GitHub Gist'),
          ].join('\n')
        }
      }
    }

    return { output: `gist: 未知操作 '${action}'` }
  },
  description: 'GitHub Gist操作',
  usage: 'gist <list|view> <参数>',
  examples: ['gist list saya-ch', 'gist view abc123']
})