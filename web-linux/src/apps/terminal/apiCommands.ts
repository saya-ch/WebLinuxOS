import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.openWeatherMap.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${API_CONFIG.openWeatherMap.key}&units=metric&lang=zh_cn`
      )
      
      if (!response.ok) {
        return { output: `天气查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      const output = [
        `🌤️  ${data.name}, ${data.sys.country}`,
        `温度: ${data.main.temp}°C (体感 ${data.main.feels_like}°C)`,
        `天气: ${data.weather[0].description}`,
        `湿度: ${data.main.humidity}%`,
        `风速: ${data.wind.speed} m/s`,
        `气压: ${data.main.pressure} hPa`,
        `能见度: ${data.visibility ? data.visibility / 1000 : 'N/A'} km`,
        `日出: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
        `日落: ${new Date(data.sys.sunset * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, '天气查询') }
    }
  },
  description: '查询天气',
  usage: 'weather [城市名]',
  examples: ['weather Beijing', 'weather Shanghai']
})

registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const symbol = args[0] ? args[0].toUpperCase() : 'BTC'
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.coinGecko.baseUrl}/coins/markets?vs_currency=usd&ids=${symbol.toLowerCase()}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`
      )
      
      if (!response.ok) {
        return { output: `加密货币查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      if (data.length === 0) {
        return { output: `未找到 ${symbol} 的数据` }
      }
      
      const coin = data[0]
      
      const output = [
        `💰 ${coin.name} (${coin.symbol.toUpperCase()})`,
        `价格: $${coin.current_price.toLocaleString()}`,
        `市值: $${coin.market_cap.toLocaleString()}`,
        `24h 涨跌: ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%`,
        `24h 成交量: $${coin.total_volume.toLocaleString()}`,
        `流通供应量: ${coin.circulating_supply} ${coin.symbol.toUpperCase()}`,
        `最高价(24h): $${coin.high_24h.toLocaleString()}`,
        `最低价(24h): $${coin.low_24h.toLocaleString()}`,
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, '加密货币查询') }
    }
  },
  description: '查询加密货币价格',
  usage: 'crypto [BTC|ETH|其他]',
  examples: ['crypto', 'crypto BTC', 'crypto ETH']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.newsApi.baseUrl}/top-headlines?country=cn&apiKey=${API_CONFIG.newsApi.key}&pageSize=5`
      )
      
      if (!response.ok) {
        return { output: `新闻获取失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      const output = [
        '📰 最新新闻',
        '',
        ...data.articles.map((article: any, index: number) => [
          `${index + 1}. ${article.title}`,
          `   来源: ${article.source.name}`,
          `   ${article.description}`,
          '',
        ].join('\n')),
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, '新闻获取') }
    }
  },
  description: '获取最新新闻',
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
          '🌍 翻译工具',
          '',
          '用法: translate <文本>',
          '',
          '示例:',
          '  translate Hello World',
          '  translate 你好世界',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.myMemory.baseUrl}/get?q=${encodeURIComponent(text)}&langpair=en|zh`
      )
      
      if (!response.ok) {
        return { output: `翻译失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      return {
        output: [
          `原文: ${text}`,
          `译文: ${data.responseData.translatedText}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, '翻译') }
    }
  },
  description: '英文翻译中文',
  usage: 'translate <文本>',
  examples: ['translate Hello World', 'translate Good morning']
})

registerCommand('time', {
  handler: (): CommandResult => {
    const now = new Date()
    
    const output = [
      '🕐 当前时间',
      '',
      `本地时间: ${now.toLocaleString('zh-CN')}`,
      `UTC时间: ${now.toISOString()}`,
      `时间戳(秒): ${Math.floor(now.getTime() / 1000)}`,
      `时间戳(毫秒): ${now.getTime()}`,
      `星期: ${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`,
      `月份: ${now.getMonth() + 1}`,
      `日期: ${now.getDate()}`,
      `小时: ${now.getHours()}`,
      `分钟: ${now.getMinutes()}`,
      `秒: ${now.getSeconds()}`,
    ].join('\n')
    
    return { output }
  },
  description: '显示当前时间',
  usage: 'time',
  examples: ['time']
})

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '💱 汇率查询',
          '',
          '用法: currency <金额> <货币代码>',
          '',
          '支持的货币代码:',
          '  CNY, USD, EUR, JPY, GBP, KRW, HKD, AUD, CAD',
          '',
          '示例:',
          '  currency 100 USD CNY',
          '  currency 100 EUR USD',
        ].join('\n')
      }
    }
    
    const amount = parseFloat(args[0])
    const from = args[1].toUpperCase()
    const to = args[2] ? args[2].toUpperCase() : 'CNY'
    
    if (isNaN(amount)) {
      return { output: '无效的金额' }
    }
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.exchangeRate.baseUrl}/${API_CONFIG.exchangeRate.key}/latest/${from}`
      )
      
      if (!response.ok) {
        return { output: `汇率查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      if (!data.conversion_rates[to]) {
        return { output: `不支持的货币代码: ${to}` }
      }
      
      const rate = data.conversion_rates[to]
      const result = amount * rate
      
      return {
        output: [
          `${amount} ${from} = ${result.toFixed(2)} ${to}`,
          `汇率: 1 ${from} = ${rate.toFixed(4)} ${to}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, '汇率查询') }
    }
  },
  description: '汇率查询',
  usage: 'currency <金额> <货币代码> [目标货币]',
  examples: ['currency 100 USD CNY', 'currency 100 EUR']
})

registerCommand('ip', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.ipify.baseUrl}?format=json`)
      
      if (!response.ok) {
        return { output: `IP查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      return {
        output: [
          '🌐 网络信息',
          '',
          `公网IP: ${data.ip}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, 'IP查询') }
    }
  },
  description: '查询公网IP',
  usage: 'ip',
  examples: ['ip']
})

registerCommand('stock', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const symbol = args[0] ? args[0].toUpperCase() : 'AAPL'
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.yahooFinance.baseUrl}/finance/quote?symbols=${symbol}`
      )
      
      if (!response.ok) {
        return { output: `股票查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      if (!data.quoteResponse || !data.quoteResponse.result || data.quoteResponse.result.length === 0) {
        return { output: `未找到 ${symbol} 的数据` }
      }
      
      const stock = data.quoteResponse.result[0]
      
      const output = [
        `📈 ${stock.shortName || stock.symbol}`,
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
  description: '查询股票信息',
  usage: 'stock [股票代码]',
  examples: ['stock', 'stock AAPL', 'stock GOOGL', 'stock MSFT']
})

registerCommand('joke', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.jokeApi.baseUrl}/joke/Any?type=single&lang=zh`)
      
      if (!response.ok) {
        return { output: `获取笑话失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      return {
        output: [
          '🤣 每日一笑',
          '',
          data.joke,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, '笑话获取') }
    }
  },
  description: '获取一个笑话',
  usage: 'joke',
  examples: ['joke']
})

registerCommand('quote', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.quotable.baseUrl}/random`)
      
      if (!response.ok) {
        return { output: `获取名言失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      return {
        output: [
          '💡 名言警句',
          '',
          `"${data.content}"`,
          `—— ${data.author}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, '名言获取') }
    }
  },
  description: '获取一句名言',
  usage: 'quote',
  examples: ['quote']
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
          '  define hello',
          '  define computer',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.dictionaryApi.baseUrl}/entries/en/${word}`
      )
      
      if (!response.ok) {
        return { output: `词典查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      if (data.length === 0) {
        return { output: `未找到 "${word}" 的定义` }
      }
      
      const entry = data[0]
      const meanings = entry.meanings.slice(0, 3)
      
      const output = [
        `📖 ${entry.word} ${entry.phonetic ? `[${entry.phonetic}]` : ''}`,
        '',
        ...meanings.map((meaning: any, index: number) => [
          `${index + 1}. ${meaning.partOfSpeech}`,
          ...meaning.definitions.slice(0, 2).map((def: any, defIndex: number) => [
            `   ${defIndex + 1}. ${def.definition}`,
            def.example ? `      示例: "${def.example}"` : '',
          ].filter(Boolean).join('\n')),
        ].join('\n')),
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, '词典查询') }
    }
  },
  description: '查询英文单词定义',
  usage: 'define <单词>',
  examples: ['define hello', 'define computer']
})