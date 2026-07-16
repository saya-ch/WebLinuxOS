import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  beijing: { lat: 39.9042, lon: 116.4074 },
  shanghai: { lat: 31.2304, lon: 121.4737 },
  guangzhou: { lat: 23.1291, lon: 113.2644 },
  shenzhen: { lat: 22.5431, lon: 114.0579 },
  hangzhou: { lat: 30.2741, lon: 120.1551 },
  wuhan: { lat: 30.5928, lon: 114.3055 },
  chengdu: { lat: 30.5728, lon: 104.0668 },
  xian: { lat: 34.3416, lon: 108.9398 },
  nanjing: { lat: 32.0603, lon: 118.7969 },
  changsha: { lat: 28.2280, lon: 112.9388 },
  hongkong: { lat: 22.3193, lon: 114.1694 },
  taipei: { lat: 25.0330, lon: 121.5654 },
  tokyo: { lat: 35.6762, lon: 139.6503 },
  seoul: { lat: 37.5665, lon: 126.9780 },
  singapore: { lat: 1.3521, lon: 103.8198 },
  london: { lat: 51.5074, lon: -0.1278 },
  newyork: { lat: 40.7128, lon: -74.0060 },
  losangeles: { lat: 34.0522, lon: -118.2437 },
  paris: { lat: 48.8566, lon: 2.3522 },
  berlin: { lat: 52.5200, lon: 13.4050 },
}

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = (args.join(' ') || 'Beijing').toLowerCase().replace(/\s+/g, '')
    
    const coords = CITY_COORDS[city]
    
    if (!coords) {
      return {
        output: [
          '🌤️  天气查询',
          '',
          '支持的城市:',
          '  国内: Beijing, Shanghai, Guangzhou, Shenzhen, Hangzhou, Wuhan, Chengdu, Xian, Nanjing, Changsha',
          '  国际: Tokyo, Seoul, Singapore, London, NewYork, LosAngeles, Paris, Berlin',
          '',
          '示例:',
          '  weather Beijing',
          '  weather Shanghai',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,uv_index_max&timezone=Asia/Shanghai`
      )
      
      if (!response.ok) {
        return { output: `天气查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      const weatherCodes: Record<number, string> = {
        0: '晴朗',
        1: '晴',
        2: '多云',
        3: '阴',
        45: '雾',
        48: '雾凇',
        51: '毛毛雨',
        53: '小雨',
        55: '中雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        77: '雪粒',
        80: '阵雨',
        81: '中阵雨',
        82: '大阵雨',
        85: '阵雪',
        86: '阵大雪',
        95: '雷暴',
        96: '雷暴伴冰雹',
        99: '雷暴伴大冰雹',
      }
      
      const current = data.current
      const daily = data.daily
      const cityName = city.charAt(0).toUpperCase() + city.slice(1)
      
      const output = [
        `🌤️  ${cityName} 天气`,
        '',
        `当前温度: ${current.temperature_2m}°C`,
        `体感温度: ${current.apparent_temperature}°C`,
        `天气: ${weatherCodes[current.weather_code] || '未知'}`,
        `湿度: ${current.relative_humidity_2m}%`,
        `风速: ${current.wind_speed_10m} km/h`,
        '',
        '今日预报:',
        `  最高温度: ${daily.temperature_2m_max[0]}°C`,
        `  最低温度: ${daily.temperature_2m_min[0]}°C`,
        `  紫外线指数: ${daily.uv_index_max[0]}`,
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, '天气查询') }
    }
  },
  description: '查询天气（使用 Open-Meteo 公开API）',
  usage: 'weather [城市名]',
  examples: ['weather Beijing', 'weather Shanghai', 'weather Tokyo']
})

registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const symbol = args[0] ? args[0].toUpperCase() : 'BTC'
    
    const coinIds: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      USDT: 'tether',
      BNB: 'binancecoin',
      SOL: 'solana',
      XRP: 'ripple',
      ADA: 'cardano',
      AVAX: 'avalanche-2',
      DOGE: 'dogecoin',
      DOT: 'polkadot',
    }
    
    const coinId = coinIds[symbol] || symbol.toLowerCase()
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.coinGecko.baseUrl}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`
      )
      
      if (!response.ok) {
        return { output: `加密货币查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      if (data.length === 0) {
        return {
          output: [
            `未找到 ${symbol} 的数据`,
            '',
            '支持的加密货币:',
            '  BTC, ETH, USDT, BNB, SOL, XRP, ADA, AVAX, DOGE, DOT',
          ].join('\n')
        }
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
  description: '查询加密货币价格（使用 CoinGecko 公开API）',
  usage: 'crypto [BTC|ETH|其他]',
  examples: ['crypto', 'crypto BTC', 'crypto ETH']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const topStoriesResponse = await fetchWithTimeout(
        `${API_CONFIG.hackerNews.baseUrl}/topstories.json`
      )
      
      if (!topStoriesResponse.ok) {
        return { output: `新闻获取失败: ${topStoriesResponse.status} ${topStoriesResponse.statusText}` }
      }
      
      const topStories = await topStoriesResponse.json()
      const storyIds = topStories.slice(0, 5)
      
      const stories = await Promise.all(
        storyIds.map((id: number) => 
          fetchWithTimeout(`${API_CONFIG.hackerNews.baseUrl}/item/${id}.json`)
            .then(res => res.json())
        )
      )
      
      const output = [
        '📰 Hacker News 热门新闻',
        '',
        ...stories.map((story: any, index: number) => [
          `${index + 1}. ${story.title}`,
          `   作者: ${story.by} | 评论: ${story.descendants || 0}`,
          `   链接: ${story.url}`,
          '',
        ].join('\n')),
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, '新闻获取') }
    }
  },
  description: '获取 Hacker News 热门新闻（无需API key）',
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
          `译文: ${data.responseData?.translatedText || '翻译结果不可用'}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, '翻译') }
    }
  },
  description: '英文翻译中文（使用 MyMemory 公开API）',
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
          '用法: currency <金额> <货币代码> [目标货币]',
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
        `https://api.frankfurter.app/latest?from=${from}&to=${to}`
      )
      
      if (!response.ok) {
        return { output: `汇率查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      if (!data.rates[to]) {
        return { output: `不支持的货币代码: ${to}` }
      }
      
      const rate = data.rates[to]
      const result = amount * rate
      
      return {
        output: [
          `${amount} ${from} = ${result.toFixed(2)} ${to}`,
          `汇率: 1 ${from} = ${rate.toFixed(4)} ${to}`,
          `更新时间: ${data.date}`,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, '汇率查询') }
    }
  },
  description: '汇率查询（使用 Frankfurter 公开API）',
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
      
      const ipInfoResponse = await fetchWithTimeout(`https://ipapi.co/${data.ip}/json/`)
      let ipInfo = null
      if (ipInfoResponse.ok) {
        ipInfo = await ipInfoResponse.json()
      }
      
      const output = [
        '🌐 网络信息',
        '',
        `公网IP: ${data.ip}`,
        ipInfo ? `国家: ${ipInfo.country_name}` : '',
        ipInfo ? `城市: ${ipInfo.city}` : '',
        ipInfo ? `运营商: ${ipInfo.org}` : '',
        ipInfo ? `时区: ${ipInfo.timezone}` : '',
      ].filter(Boolean).join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, 'IP查询') }
    }
  },
  description: '查询公网IP和地理位置信息',
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
  description: '查询股票信息（使用 Yahoo Finance 公开API）',
  usage: 'stock [股票代码]',
  examples: ['stock', 'stock AAPL', 'stock GOOGL', 'stock MSFT']
})

registerCommand('joke', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.dadJoke.baseUrl}/api/joke`, {
        headers: { 'Accept': 'application/json' }
      })
      
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
  description: '获取一个笑话（使用 I Can Haz Dad Joke 公开API）',
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
  description: '获取一句名言（使用 Quotable 公开API）',
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
  description: '查询英文单词定义（使用 Free Dictionary 公开API）',
  usage: 'define <单词>',
  examples: ['define hello', 'define computer']
})

registerCommand('nasa', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.nasa.baseUrl}/apod?api_key=${API_CONFIG.nasa.key}`
      )
      
      if (!response.ok) {
        return { output: `NASA APOD 获取失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      const output = [
        '🚀 NASA 每日天文图片',
        '',
        `标题: ${data.title}`,
        `日期: ${data.date}`,
        '',
        `说明: ${data.explanation}`,
        '',
        `图片链接: ${data.url}`,
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, 'NASA APOD') }
    }
  },
  description: '获取 NASA 每日天文图片（APOD）',
  usage: 'nasa',
  examples: ['nasa']
})

registerCommand('advice', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.adviceSlip.baseUrl}/advice`)
      
      if (!response.ok) {
        return { output: `获取建议失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      return {
        output: [
          '💡 每日建议',
          '',
          data.slip.advice,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, '建议获取') }
    }
  },
  description: '获取一条生活建议（使用 Advice Slip 公开API）',
  usage: 'advice',
  examples: ['advice']
})

registerCommand('github-trending', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const language = args[0] || 'javascript'
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.githubApi.baseUrl}/search/repositories?q=language:${language}&sort=stars&order=desc&per_page=5`
      )
      
      if (!response.ok) {
        return { output: `GitHub Trending 获取失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      const output = [
        `📊 GitHub Trending (${language})`,
        '',
        ...data.items.slice(0, 5).map((repo: any, index: number) => [
          `${index + 1}. ${repo.full_name}`,
          `   Stars: ${repo.stargazers_count.toLocaleString()}`,
          `   Forks: ${repo.forks_count.toLocaleString()}`,
          `   Description: ${repo.description || '无描述'}`,
          `   URL: ${repo.html_url}`,
          '',
        ].join('\n')),
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, 'GitHub Trending') }
    }
  },
  description: '查看 GitHub 热门仓库',
  usage: 'github-trending [语言]',
  examples: ['github-trending', 'github-trending javascript', 'github-trending python']
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
          '用法: country <国家名称或代码>',
          '',
          '示例:',
          '  country China',
          '  country CN',
          '  country USA',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.restCountries.baseUrl}/name/${country}?fullText=true`
      )
      
      if (!response.ok) {
        const codeResponse = await fetchWithTimeout(
          `${API_CONFIG.restCountries.baseUrl}/alpha/${country.toUpperCase()}`
        )
        if (!codeResponse.ok) {
          return { output: `国家查询失败: ${codeResponse.status} ${codeResponse.statusText}` }
        }
        return codeResponse.json().then(processCountryData)
      }
      
      const data = await response.json()
      return processCountryData(data)
    } catch (error) {
      return { output: handleApiError(error, '国家查询') }
    }
    
    function processCountryData(data: any): CommandResult {
      const country = Array.isArray(data) ? data[0] : data
      
      const output = [
        `🌍 ${country.name.common}`,
        '',
        `官方名称: ${country.name.official}`,
        `代码: ${country.cca2} / ${country.cca3}`,
        `首都: ${country.capital?.[0] || '无'}`,
        `人口: ${country.population.toLocaleString()}`,
        `面积: ${country.area.toLocaleString()} km²`,
        `时区: ${country.timezones?.[0] || 'N/A'}`,
        `货币: ${Object.values(country.currencies || {}).map((c: any) => c.name).join(', ')}`,
        `语言: ${Object.values(country.languages || {}).join(', ')}`,
        `所属大洲: ${country.continents?.join(', ') || 'N/A'}`,
      ].join('\n')
      
      return { output }
    }
  },
  description: '查询国家信息（使用 REST Countries 公开API）',
  usage: 'country <国家名称或代码>',
  examples: ['country China', 'country USA', 'country JP']
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
          '🐱 猫咪冷知识',
          '',
          data.fact,
        ].join('\n')
      }
    } catch (error) {
      return { output: handleApiError(error, '猫知识获取') }
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
          `🔢 数字 ${num} 的冷知识`,
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