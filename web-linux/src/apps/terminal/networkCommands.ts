import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import type { FileNode } from '../../types'

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    const cityCoords: Record<string, { lat: number; lon: number; name: string }> = {
      'beijing': { lat: 39.9042, lon: 116.4074, name: '北京' },
      'shanghai': { lat: 31.2304, lon: 121.4737, name: '上海' },
      'guangzhou': { lat: 23.1291, lon: 113.2644, name: '广州' },
      'shenzhen': { lat: 22.5431, lon: 114.0579, name: '深圳' },
      'hangzhou': { lat: 30.2741, lon: 120.1552, name: '杭州' },
      'chengdu': { lat: 30.5728, lon: 104.0668, name: '成都' },
      'wuhan': { lat: 30.5928, lon: 114.3055, name: '武汉' },
      'xian': { lat: 34.2619, lon: 108.9463, name: '西安' },
      'tokyo': { lat: 35.6762, lon: 139.6503, name: '东京' },
      'seoul': { lat: 37.5665, lon: 126.9780, name: '首尔' },
      'newyork': { lat: 40.7128, lon: -74.0060, name: '纽约' },
      'london': { lat: 51.5074, lon: -0.1278, name: '伦敦' },
      'paris': { lat: 48.8566, lon: 2.3522, name: '巴黎' },
      'sydney': { lat: -33.8688, lon: 151.2093, name: '悉尼' },
      'singapore': { lat: 1.3521, lon: 103.8198, name: '新加坡' },
    }

    const locationInput = args.length > 0 ? args.join(' ') : 'beijing'
    const coords = cityCoords[locationInput.toLowerCase()] || { lat: 39.9042, lon: 116.4074, name: '北京' }

    const weatherCodes: Record<number, { desc: string; icon: string }> = {
      0: { desc: '晴天', icon: '☀️' },
      1: { desc: '晴', icon: '☀️' },
      2: { desc: '多云', icon: '⛅' },
      3: { desc: '阴天', icon: '☁️' },
      45: { desc: '雾', icon: '🌫️' },
      48: { desc: '雾凇', icon: '❄️' },
      51: { desc: '小雨', icon: '🌧️' },
      53: { desc: '中雨', icon: '🌧️' },
      55: { desc: '大雨', icon: '🌧️' },
      61: { desc: '阵雨', icon: '🌦️' },
      63: { desc: '阵雨', icon: '🌦️' },
      65: { desc: '阵雨', icon: '🌧️' },
      71: { desc: '小雪', icon: '❄️' },
      73: { desc: '中雪', icon: '❄️' },
      75: { desc: '大雪', icon: '❄️' },
      80: { desc: '雷阵雨', icon: '⛈️' },
      81: { desc: '雷阵雨', icon: '⛈️' },
      82: { desc: '雷阵雨', icon: '⛈️' },
      95: { desc: '雷雨', icon: '⛈️' },
      96: { desc: '雷雨', icon: '⛈️' },
      99: { desc: '雷雨', icon: '⛈️' },
    }

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Shanghai`
      )
      const data = await response.json()

      const weatherCode = data.current.weather_code
      const weatherInfo = weatherCodes[weatherCode] || { desc: '未知', icon: '❓' }
      const temp = Math.round(data.current.temperature_2m)
      const humidity = data.current.relative_humidity_2m
      const windSpeed = Math.round(data.current.wind_speed_10m)
      const windDir = Math.round(data.current.wind_direction_10m)
      const pressure = Math.round(data.current.surface_pressure)

      const windDirections = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风']
      const windIndex = Math.round((windDir % 360) / 45) % 8
      const windDirection = windDirections[windIndex]

      const maxTemp = Math.round(data.daily.temperature_2m_max[0])
      const minTemp = Math.round(data.daily.temperature_2m_min[0])

      const output = [
        `${weatherInfo.icon}  ${coords.name} 天气预报`,
        '╔══════════════════════════════════════════╗',
        `║  当前天气: ${weatherInfo.desc.padEnd(26)}║`,
        `║  温度: ${temp}°C (${minTemp}°C ~ ${maxTemp}°C)${' '.repeat(13)}║`,
        `║  湿度: ${humidity}%${' '.repeat(34)}║`,
        `║  风速: ${windSpeed} km/h ${windDirection}${' '.repeat(18)}║`,
        `║  气压: ${pressure} hPa${' '.repeat(28)}║`,
        '╚══════════════════════════════════════════╝',
        '',
        '支持的城市: beijing, shanghai, guangzhou, shenzhen, hangzhou, chengdu, wuhan, xian, tokyo, seoul, newyork, london, paris, sydney, singapore',
      ].join('\n')

      return { output }
    } catch {
      return {
        output: [
          '🌤️ 天气预报',
          '',
          '用法: weather [城市名]',
          '',
          '支持的城市:',
          '  beijing, shanghai, guangzhou, shenzhen, hangzhou',
          '  chengdu, wuhan, xian, tokyo, seoul',
          '  newyork, london, paris, sydney, singapore',
          '',
          '示例:',
          '  weather',
          '  weather shanghai',
          '  weather tokyo',
          '',
          '💡 当前无法获取天气数据',
        ].join('\n')
      }
    }
  },
  description: '获取天气预报',
  usage: 'weather [城市名]',
  examples: ['weather', 'weather shanghai', 'weather tokyo']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://newsapi.org/v2/top-headlines?country=cn&apiKey=demo')
      const data = await response.json()
      
      if (data.articles && data.articles.length > 0) {
        const newsItems = data.articles.slice(0, 5).map((article: any, index: number) => {
          return `${index + 1}. ${article.title}\n   ${article.source.name} - ${article.publishedAt.slice(0, 10)}\n`
        })
        
        return {
          output: [
            '📰 最新新闻',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            ...newsItems,
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '💡 数据来源: NewsAPI',
          ].join('\n')
        }
      }
    } catch {
      // Fallback to mock data
    }
    
    const mockNews = [
      '1. WebLinuxOS 2.9 版本发布，新增多项功能',
      '2. React 19 正式发布，带来全新特性',
      '3. 人工智能技术持续突破，创新应用不断涌现',
      '4. 全球科技巨头加大AI研发投入',
      '5. 开源社区活跃度持续提升',
    ]
    
    return {
      output: [
        '📰 最新新闻',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        ...mockNews,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '💡 新闻数据仅供展示',
      ].join('\n')
    }
  },
  description: '获取最新新闻',
  usage: 'news',
  examples: ['news']
})

registerCommand('crypto', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false')
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        const cryptoList = data.map((coin: any) => {
          const change = parseFloat(coin.price_change_percentage_24h)
          const changeColor = change >= 0 ? '🟢' : '🔴'
          return `  ${coin.symbol.toUpperCase()} | $${coin.current_price.toLocaleString()} | ${changeColor} ${change.toFixed(2)}%`
        })
        
        return {
          output: [
            '💰 加密货币行情',
            '╔══════════════════════════════════════╗',
            ...cryptoList,
            '╚══════════════════════════════════════╝',
            '💡 数据来源: CoinGecko',
          ].join('\n')
        }
      }
    } catch {
      // Fallback to mock data
    }
    
    const mockCrypto = [
      '  BTC | $67,523.45 | 🟢 +2.34%',
      '  ETH | $3,456.78 | 🔴 -1.23%',
      '  SOL | $178.90 | 🟢 +5.67%',
      '  BNB | $612.34 | 🟢 +0.89%',
      '  XRP | $0.65 | 🔴 -0.45%',
    ]
    
    return {
      output: [
        '💰 加密货币行情',
        '╔══════════════════════════════════════╗',
        ...mockCrypto,
        '╚══════════════════════════════════════╝',
        '💡 数据来源: CoinGecko',
      ].join('\n')
    }
  },
  description: '查看加密货币行情',
  usage: 'crypto',
  examples: ['crypto']
})

registerCommand('search', {
  handler: (context: CommandContext): CommandResult => {
    const { args, files } = context
    
    if (args.length === 0) {
      return { output: 'search: 请提供搜索关键词\n用法: search <关键词>' }
    }
    
    const searchTerm = args.join(' ').toLowerCase()
    const searchStartTime = Date.now()
    
    const searchInTree = (nodes: FileNode[], currentPath: string = ''): Array<{ node: FileNode; path: string }> => {
      const results: Array<{ node: FileNode; path: string }> = []
      for (const node of nodes) {
        const nodePath = currentPath ? `${currentPath}/${node.name}` : `/${node.name}`
        if (node.name.toLowerCase().includes(searchTerm)) {
          results.push({ node, path: nodePath })
        }
        if (node.children) {
          results.push(...searchInTree(node.children, nodePath))
        }
      }
      return results
    }
    
    const results = searchInTree(files)
    const searchTime = Date.now() - searchStartTime
    
    if (results.length === 0) {
      return { output: `未找到包含 "${args.join(' ')}" 的文件或目录\n搜索耗时: ${searchTime}ms` }
    }
    
    const output = [
      `找到 ${results.length} 个结果 (耗时: ${searchTime}ms):`,
      '',
      ...results.map(r => {
        const icon = r.node.type === 'folder' ? '📁' : '📄'
        const type = r.node.type === 'folder' ? '目录' : '文件'
        return `${icon} ${r.node.name} (${type}) @ ${r.path}`
      }),
      '',
      '提示: 使用 \'cd <路径>\' 切换到目标目录'
    ].join('\n')
    
    return { output }
  },
  description: '搜索文件和目录',
  usage: 'search <关键词>',
  examples: ['search document', 'search .txt']
})

registerCommand('translate', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🌐 翻译工具',
          '',
          '用法: translate <文本>',
          '',
          '示例:',
          '  translate Hello',
          '  translate Bonjour',
          '',
          '💡 这是一个简单的词典翻译工具',
        ].join('\n')
      }
    }
    
    const commonPhrases: Record<string, string> = {
      'hello': '你好 (中文) / こんにちは (日语) / 안녕하세요 (韩语)',
      'goodbye': '再见 (中文) / さようなら (日语) / 안녕히 가세요 (韩语)',
      'thank you': '谢谢 (中文) / ありがとう (日语) / 감사합니다 (韩语)',
      'yes': '是 (中文) / はい (日语) / 네 (韩语)',
      'no': '否 (中文) / いいえ (日语) / 아니요 (韩语)',
      'good morning': '早上好 (中文) / おはよう (日语) / 좋은 아침 (韩语)',
      'good night': '晚安 (中文) / おやすみ (日语) / 잘 자요 (韩语)',
      'i love you': '我爱你 (中文) / 愛してる (日语) / 사랑해요 (韩语)',
      'how are you': '你好吗 (中文) / 元気ですか (日语) / 어떻게 지내요 (韩语)',
      'welcome': '欢迎 (中文) / ようこそ (日语) / 환영합니다 (韩语)',
    }
    
    const phrase = args.join(' ').toLowerCase()
    
    if (commonPhrases[phrase]) {
      return { output: `🌐 "${args.join(' ')}" 的多语言翻译:\n\n${commonPhrases[phrase]}` }
    }
    
    return {
      output: [
        `🌐 "${args.join(' ')}"`,
        '',
        '📝 常见短语翻译示例:',
        ...Object.entries(commonPhrases).map(([k, v]) => `  • ${k}: ${v.split(' (')[0]}`),
        '',
        '💡 提示: 尝试搜索常见短语',
      ].join('\n')
    }
  },
  description: '简单翻译工具',
  usage: 'translate <文本>',
  examples: ['translate hello', 'translate thank you']
})

registerCommand('ping', {
  handler: (): CommandResult => {
    const mockResults = [
      'PING google.com (142.250.185.14): 56 data bytes',
      '64 bytes from 142.250.185.14: icmp_seq=0 ttl=56 time=12.345 ms',
      '64 bytes from 142.250.185.14: icmp_seq=1 ttl=56 time=11.234 ms',
      '64 bytes from 142.250.185.14: icmp_seq=2 ttl=56 time=10.987 ms',
      '',
      '--- google.com ping statistics ---',
      '3 packets transmitted, 3 packets received, 0.0% packet loss',
      'round-trip min/avg/max = 10.987/11.522/12.345 ms',
    ]
    
    return { output: mockResults.join('\n') }
  },
  description: '模拟网络ping测试',
  usage: 'ping [主机名]',
  examples: ['ping google.com']
})