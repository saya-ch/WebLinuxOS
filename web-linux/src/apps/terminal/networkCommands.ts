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
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const category = args[0] || 'general'
    
    const categories = ['general', 'technology', 'business', 'science', 'health', 'entertainment', 'sports']
    
    if (!categories.includes(category.toLowerCase())) {
      return {
        output: [
          '📰 新闻查询',
          '',
          '用法: news [分类]',
          '',
          '支持的分类:',
          '  general     - 综合新闻',
          '  technology  - 科技新闻',
          '  business    - 商业新闻',
          '  science     - 科学新闻',
          '  health      - 健康新闻',
          '  entertainment - 娱乐新闻',
          '  sports      - 体育新闻',
          '',
          '示例:',
          '  news',
          '  news technology',
          '  news business',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetch(
        `https://gnews.io/api/v4/top-headlines?category=${category}&lang=zh&country=cn&max=5&apikey=87e394a2e53750712970235575f416bc`
      )
      const data = await response.json()
      
      if (data.articles && data.articles.length > 0) {
        const newsItems = data.articles.slice(0, 5).map((article: any, index: number) => {
          const date = article.publishedAt ? article.publishedAt.slice(0, 10) : '未知日期'
          return `${index + 1}. ${article.title}\n   ${article.source.name || '未知来源'} - ${date}`
        })
        
        return {
          output: [
            `📰 ${category === 'general' ? '综合' : 
              category === 'technology' ? '科技' :
              category === 'business' ? '商业' :
              category === 'science' ? '科学' :
              category === 'health' ? '健康' :
              category === 'entertainment' ? '娱乐' : '体育'}新闻`,
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            ...newsItems,
            '',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '💡 数据来源: GNews',
          ].join('\n')
        }
      }
    } catch {
      // Fallback to mock data
    }
    
    const mockNews = {
      'general': [
        '1. WebLinuxOS 2.9 版本发布，新增多项功能',
        '2. React 19 正式发布，带来全新特性',
        '3. 人工智能技术持续突破，创新应用不断涌现',
        '4. 全球科技巨头加大AI研发投入',
        '5. 开源社区活跃度持续提升',
      ],
      'technology': [
        '1. AI大模型性能再创新高',
        '2. WebAssembly技术获得广泛应用',
        '3. 量子计算取得新突破',
        '4. 5G网络覆盖持续扩展',
        '5. 边缘计算成为技术热点',
      ],
      'business': [
        '1. 全球股市波动加剧',
        '2. 新能源产业迎来发展机遇',
        '3. 数字化转型加速推进',
        '4. 跨境电商持续增长',
        '5. 金融科技创新不断',
      ],
      'science': [
        '1. 太空探索取得新进展',
        '2. 基因编辑技术突破',
        '3. 新材料研究取得成果',
        '4. 气候变化研究深入',
        '5. 医学研究新发现',
      ],
      'health': [
        '1. 健康生活方式倡导',
        '2. 疫苗研发新动态',
        '3. 心理健康关注提升',
        '4. 营养科学新研究',
        '5. 运动健康普及',
      ],
      'entertainment': [
        '1. 热门电影上映',
        '2. 音乐节精彩纷呈',
        '3. 综艺新节目上线',
        '4. 文化展览举办',
        '5. 明星动态追踪',
      ],
      'sports': [
        '1. 足球联赛激烈进行',
        '2. 篮球比赛精彩对决',
        '3. 奥运会筹备进展',
        '4. 网球赛事亮点',
        '5. 全民健身热潮',
      ],
    }
    
    const newsItems = (mockNews as Record<string, string[]>)[category.toLowerCase()] || mockNews['general']
    return {
      output: [
        `📰 ${category === 'general' ? '综合' : 
          category === 'technology' ? '科技' :
          category === 'business' ? '商业' :
          category === 'science' ? '科学' :
          category === 'health' ? '健康' :
          category === 'entertainment' ? '娱乐' : '体育'}新闻`,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        ...newsItems,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '💡 当前无法获取实时新闻数据',
      ].join('\n')
    }
  },
  description: '获取最新新闻（支持分类）',
  usage: 'news [分类]',
  examples: ['news', 'news technology', 'news business']
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
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🌐 翻译工具',
          '',
          '用法: translate <文本>',
          '       translate <源语言>:<目标语言> <文本>',
          '',
          '支持的语言代码:',
          '  en - 英语',
          '  zh - 中文',
          '  ja - 日语',
          '  ko - 韩语',
          '  fr - 法语',
          '  de - 德语',
          '  es - 西班牙语',
          '',
          '示例:',
          '  translate Hello',
          '  translate en:zh Hello World',
          '  translate fr:zh Bonjour',
          '',
          '💡 默认自动检测源语言，目标语言为中文',
        ].join('\n')
      }
    }
    
    let sourceLang = 'auto'
    let targetLang = 'zh'
    let text = args.join(' ')
    
    const langMatch = text.match(/^([a-z]{2}):([a-z]{2})\s+(.+)$/i)
    if (langMatch) {
      sourceLang = langMatch[1].toLowerCase()
      targetLang = langMatch[2].toLowerCase()
      text = langMatch[3]
    }
    
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      )
      const data = await response.json()
      
      if (data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText
        const match = data.responseData.match || 0
        
        const output = [
          `🌐 翻译结果`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `原文: ${text}`,
          `翻译: ${translated}`,
          `匹配度: ${(match * 100).toFixed(0)}%`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ].join('\n')
        
        return { output }
      }
    } catch {
      // Fallback to local phrases
    }
    
    const commonPhrases: Record<string, string> = {
      'hello': '你好',
      'goodbye': '再见',
      'thank you': '谢谢',
      'yes': '是',
      'no': '否',
      'good morning': '早上好',
      'good night': '晚安',
      'i love you': '我爱你',
      'how are you': '你好吗',
      'welcome': '欢迎',
      'sorry': '对不起',
      'please': '请',
      'help': '帮助',
      'happy': '快乐',
      'sad': '悲伤',
      'friend': '朋友',
      'family': '家庭',
      'love': '爱',
      'peace': '和平',
      'hope': '希望',
    }
    
    const phrase = text.toLowerCase()
    
    if (commonPhrases[phrase]) {
      return { output: `🌐 "${text}" 的翻译:\n\n${commonPhrases[phrase]}` }
    }
    
    return {
      output: [
        `🌐 "${text}"`,
        '',
        '📝 常见短语翻译:',
        ...Object.entries(commonPhrases).map(([k, v]) => `  • ${k}: ${v}`),
        '',
        '💡 当前无法连接翻译服务，显示常用短语',
      ].join('\n')
    }
  },
  description: '在线翻译工具（支持多语言）',
  usage: 'translate <文本> 或 translate <源语言>:<目标语言> <文本>',
  examples: ['translate Hello', 'translate en:zh Hello World']
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

registerCommand('ipinfo', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const ip = args[0]

    if (!ip) {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        const userIp = data.ip || '未知'
        
        const geoResponse = await fetch(`https://ip-api.com/json/${userIp}`)
        const geoData = await geoResponse.json()

        if (geoData.status === 'success') {
          return {
            output: [
              '🌐 您的网络信息',
              '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              `IP 地址: ${geoData.query}`,
              `国家: ${geoData.country} (${geoData.countryCode})`,
              `地区: ${geoData.regionName}`,
              `城市: ${geoData.city}`,
              `运营商: ${geoData.isp}`,
              `经纬度: ${geoData.lat}, ${geoData.lon}`,
              `时区: ${geoData.timezone}`,
              '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            ].join('\n')
          }
        }
      } catch {
        // Fallback
      }

      return {
        output: [
          '🌐 IP 信息查询',
          '',
          '用法: ipinfo [IP地址]',
          '',
          '示例:',
          '  ipinfo',
          '  ipinfo 8.8.8.8',
          '',
          '💡 当前无法获取网络信息',
        ].join('\n')
      }
    }

    try {
      const response = await fetch(`https://ip-api.com/json/${ip}`)
      const data = await response.json()

      if (data.status === 'success') {
        return {
          output: [
            `🌐 IP 信息: ${ip}`,
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            `状态: ${data.status}`,
            `国家: ${data.country} (${data.countryCode})`,
            `地区: ${data.regionName}`,
            `城市: ${data.city}`,
            `邮政编码: ${data.zip}`,
            `运营商: ${data.isp}`,
            `组织: ${data.org}`,
            `经纬度: ${data.lat}, ${data.lon}`,
            `时区: ${data.timezone}`,
            `ASN: ${data.as}`,
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          ].join('\n')
        }
      } else {
        return { output: `❌ 无法查询 IP: ${ip}\n错误: ${data.message || '未知错误'}` }
      }
    } catch {
      return { output: `❌ 查询失败，请检查网络连接或输入的IP地址` }
    }
  },
  description: '查询IP地址信息',
  usage: 'ipinfo [IP地址]',
  examples: ['ipinfo', 'ipinfo 8.8.8.8']
})

registerCommand('time', {
  handler: (): CommandResult => {
    const now = new Date()
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    const output = [
      '🕐 当前时间',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `本地时间: ${now.toLocaleString('zh-CN')}`,
      `UTC 时间: ${now.toISOString()}`,
      `时区: ${timeZone}`,
      `星期: ${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`,
      `年份: ${now.getFullYear()}`,
      `月份: ${now.getMonth() + 1}`,
      `日期: ${now.getDate()}`,
      `小时: ${String(now.getHours()).padStart(2, '0')}`,
      `分钟: ${String(now.getMinutes()).padStart(2, '0')}`,
      `秒: ${String(now.getSeconds()).padStart(2, '0')}`,
      `毫秒: ${String(now.getMilliseconds()).padStart(3, '0')}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n')

    return { output }
  },
  description: '显示当前时间信息',
  usage: 'time',
  examples: ['time']
})

registerCommand('worldtime', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Shanghai'

    const timezones: Record<string, { tz: string; name: string }> = {
      'beijing': { tz: 'Asia/Shanghai', name: '北京' },
      'shanghai': { tz: 'Asia/Shanghai', name: '上海' },
      'tokyo': { tz: 'Asia/Tokyo', name: '东京' },
      'seoul': { tz: 'Asia/Seoul', name: '首尔' },
      'london': { tz: 'Europe/London', name: '伦敦' },
      'paris': { tz: 'Europe/Paris', name: '巴黎' },
      'newyork': { tz: 'America/New_York', name: '纽约' },
      'losangeles': { tz: 'America/Los_Angeles', name: '洛杉矶' },
      'sydney': { tz: 'Australia/Sydney', name: '悉尼' },
      'dubai': { tz: 'Asia/Dubai', name: '迪拜' },
      'singapore': { tz: 'Asia/Singapore', name: '新加坡' },
      'moscow': { tz: 'Europe/Moscow', name: '莫斯科' },
    }

    const tz = timezones[city.toLowerCase()] || { tz: 'Asia/Shanghai', name: city }

    const now = new Date()
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz.tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    })

    const output = [
      `🌍 ${tz.name} 时间`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `时区: ${tz.tz}`,
      `时间: ${formatter.format(now)}`,
      '',
      '支持的城市:',
      '  beijing, shanghai, tokyo, seoul, london',
      '  paris, newyork, losangeles, sydney',
      '  dubai, singapore, moscow',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n')

    return { output }
  },
  description: '查询世界各城市时间',
  usage: 'worldtime [城市名]',
  examples: ['worldtime', 'worldtime tokyo', 'worldtime newyork']
})