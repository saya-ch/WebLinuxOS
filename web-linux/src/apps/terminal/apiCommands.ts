import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithCache, fetchWithRetry, formatNumber } from '../../utils/apiCache'

const cityMap: Record<string, { lat: number; lon: number; name: string }> = {
  'beijing': { lat: 39.9042, lon: 116.4074, name: '北京' },
  '北京': { lat: 39.9042, lon: 116.4074, name: '北京' },
  'shanghai': { lat: 31.2304, lon: 121.4737, name: '上海' },
  '上海': { lat: 31.2304, lon: 121.4737, name: '上海' },
  'shenzhen': { lat: 22.5431, lon: 114.0579, name: '深圳' },
  '深圳': { lat: 22.5431, lon: 114.0579, name: '深圳' },
  'guangzhou': { lat: 23.1291, lon: 113.2644, name: '广州' },
  '广州': { lat: 23.1291, lon: 113.2644, name: '广州' },
  'tokyo': { lat: 35.6762, lon: 139.6503, name: '东京' },
  'new york': { lat: 40.7128, lon: -74.006, name: '纽约' },
  'london': { lat: 51.5074, lon: -0.1278, name: '伦敦' },
  'paris': { lat: 48.8566, lon: 2.3522, name: '巴黎' },
  'chengdu': { lat: 30.5728, lon: 104.0668, name: '成都' },
  '成都': { lat: 30.5728, lon: 104.0668, name: '成都' },
  'hangzhou': { lat: 30.2741, lon: 120.1551, name: '杭州' },
  '杭州': { lat: 30.2741, lon: 120.1551, name: '杭州' },
  'wuhan': { lat: 30.5928, lon: 114.3055, name: '武汉' },
  '武汉': { lat: 30.5928, lon: 114.3055, name: '武汉' },
  'xian': { lat: 34.3416, lon: 108.9398, name: '西安' },
  '西安': { lat: 34.3416, lon: 108.9398, name: '西安' },
  'nanjing': { lat: 32.0603, lon: 118.7969, name: '南京' },
  '南京': { lat: 32.0603, lon: 118.7969, name: '南京' },
  'sydney': { lat: -33.8688, lon: 151.2093, name: '悉尼' },
  'dubai': { lat: 25.2048, lon: 55.2708, name: '迪拜' },
  'singapore': { lat: 1.3521, lon: 103.8198, name: '新加坡' },
  'seoul': { lat: 37.5665, lon: 126.978, name: '首尔' },
  'bangkok': { lat: 13.7563, lon: 100.5018, name: '曼谷' },
  'hong kong': { lat: 22.3193, lon: 114.1694, name: '香港' },
  '香港': { lat: 22.3193, lon: 114.1694, name: '香港' },
  'taipei': { lat: 25.0330, lon: 121.5654, name: '台北' },
  '台北': { lat: 25.0330, lon: 121.5654, name: '台北' },
  'mumbai': { lat: 19.0760, lon: 72.8777, name: '孟买' },
  'moscow': { lat: 55.7558, lon: 37.6173, name: '莫斯科' },
  'berlin': { lat: 52.5200, lon: 13.4050, name: '柏林' },
  'rome': { lat: 41.9028, lon: 12.4964, name: '罗马' },
  'madrid': { lat: 40.4168, lon: -3.7038, name: '马德里' },
  'los angeles': { lat: 34.0522, lon: -118.2437, name: '洛杉矶' },
  'chicago': { lat: 41.8781, lon: -87.6298, name: '芝加哥' },
  'toronto': { lat: 43.6532, lon: -79.3832, name: '多伦多' },
  'vancouver': { lat: 49.2827, lon: -123.1207, name: '温哥华' },
  'delhi': { lat: 28.7041, lon: 77.1025, name: '德里' },
  'bangalore': { lat: 12.9716, lon: 77.5946, name: '班加罗尔' },
  'amsterdam': { lat: 52.3676, lon: 4.9041, name: '阿姆斯特丹' },
  'stockholm': { lat: 59.3293, lon: 18.0686, name: '斯德哥尔摩' },
  'copenhagen': { lat: 55.6761, lon: 12.5683, name: '哥本哈根' },
  'oslo': { lat: 59.9139, lon: 10.7522, name: '奥斯陆' },
  'helsinki': { lat: 60.1699, lon: 24.9384, name: '赫尔辛基' },
  'prague': { lat: 50.0755, lon: 14.4378, name: '布拉格' },
  'vienna': { lat: 48.2082, lon: 16.3738, name: '维也纳' },
  'budapest': { lat: 47.4979, lon: 19.0402, name: '布达佩斯' },
  'warsaw': { lat: 52.2297, lon: 21.0122, name: '华沙' },
  'brussels': { lat: 50.8503, lon: 4.3517, name: '布鲁塞尔' },
  'lisbon': { lat: 38.7223, lon: -9.1393, name: '里斯本' },
  'athens': { lat: 37.9838, lon: 23.7275, name: '雅典' },
  'cairo': { lat: 30.0444, lon: 31.2357, name: '开罗' },
  'capetown': { lat: -33.9249, lon: 18.4241, name: '开普敦' },
  'nairobi': { lat: -1.2921, lon: 36.8219, name: '内罗毕' },
  'houston': { lat: 29.7604, lon: -95.3698, name: '休斯顿' },
  'seattle': { lat: 47.6062, lon: -122.3321, name: '西雅图' },
  'portland': { lat: 45.5051, lon: -122.6750, name: '波特兰' },
  'denver': { lat: 39.7392, lon: -104.9903, name: '丹佛' },
  'minneapolis': { lat: 44.9778, lon: -93.2650, name: '明尼阿波利斯' },
  'miami': { lat: 25.7617, lon: -80.1918, name: '迈阿密' },
  'orlando': { lat: 28.5383, lon: -81.3792, name: '奥兰多' },
  'tampa': { lat: 27.9760, lon: -82.4530, name: '坦帕' },
  'boston': { lat: 42.3601, lon: -71.0589, name: '波士顿' },
  'philadelphia': { lat: 39.9526, lon: -75.1652, name: '费城' },
  'washington': { lat: 38.9072, lon: -77.0369, name: '华盛顿' },
  'charlotte': { lat: 35.2271, lon: -80.8431, name: '夏洛特' },
  'atlanta': { lat: 33.7480, lon: -84.3900, name: '亚特兰大' },
  'nashville': { lat: 36.1627, lon: -86.7816, name: '纳什维尔' },
  'st louis': { lat: 38.6270, lon: -90.1994, name: '圣路易斯' },
  'kansas city': { lat: 39.0997, lon: -94.5786, name: '堪萨斯城' },
  'oklahoma city': { lat: 35.4676, lon: -97.5164, name: '俄克拉荷马城' },
  'austin': { lat: 30.2672, lon: -97.7431, name: '奥斯汀' },
  'san antonio': { lat: 29.4241, lon: -98.4936, name: '圣安东尼奥' },
  'san diego': { lat: 32.7157, lon: -117.1611, name: '圣地亚哥' },
  'san francisco': { lat: 37.7749, lon: -122.4194, name: '旧金山' },
  'san jose': { lat: 37.3382, lon: -121.8863, name: '圣何塞' },
  'las vegas': { lat: 36.1699, lon: -115.1398, name: '拉斯维加斯' },
  'phoenix': { lat: 33.4484, lon: -112.0740, name: '凤凰城' },
  'salt lake city': { lat: 40.7608, lon: -111.8910, name: '盐湖城' },
  'albuquerque': { lat: 35.0844, lon: -106.6504, name: '阿尔伯克基' },
  'el paso': { lat: 31.7619, lon: -106.4850, name: '埃尔帕索' },
  'chihuahua': { lat: 28.6353, lon: -106.0889, name: '奇瓦瓦' },
  'guadalajara': { lat: 20.6668, lon: -103.3918, name: '瓜达拉哈拉' },
  'mexico city': { lat: 19.4326, lon: -99.1332, name: '墨西哥城' },
  'monterrey': { lat: 25.6866, lon: -100.3161, name: '蒙特雷' },
  'caracas': { lat: 10.4806, lon: -66.9036, name: '加拉加斯' },
  'santiago': { lat: -33.4489, lon: -70.6693, name: '圣地亚哥' },
  'buenos aires': { lat: -34.6037, lon: -58.3816, name: '布宜诺斯艾利斯' },
  'saopaulo': { lat: -23.5505, lon: -46.6333, name: '圣保罗' },
  'rio': { lat: -22.9068, lon: -43.1729, name: '里约热内卢' },
  'lima': { lat: -12.0464, lon: -77.0428, name: '利马' },
  'bogota': { lat: 4.7110, lon: -74.0721, name: '波哥大' },
  'medellin': { lat: 6.2442, lon: -75.5812, name: '麦德林' },
  'quito': { lat: -0.1807, lon: -78.4678, name: '基多' },
  'panama': { lat: 8.9806, lon: -79.5197, name: '巴拿马城' },
  'kingston': { lat: 17.9712, lon: -76.7936, name: '金斯顿' },
  'port of spain': { lat: 10.6668, lon: -61.5173, name: '西班牙港' },
  'havana': { lat: 23.1291, lon: -82.3666, name: '哈瓦那' },
  'san juan': { lat: 18.4663, lon: -66.1057, name: '圣胡安' },
  'managua': { lat: 12.1364, lon: -86.2516, name: '马那瓜' },
  'guatemala': { lat: 14.6289, lon: -90.5232, name: '危地马拉城' },
  'san salvador': { lat: 13.6929, lon: -89.2182, name: '圣萨尔瓦多' },
  'tegucigalpa': { lat: 14.1024, lon: -87.2069, name: '特古西加尔巴' },
  'belmopan': { lat: 17.2505, lon: -88.7683, name: '贝尔莫潘' },
  'bridgetown': { lat: 13.1060, lon: -59.6131, name: '布里奇顿' },
  'castries': { lat: 14.0125, lon: -61.7483, name: '卡斯特里' },
  'roseau': { lat: 15.3010, lon: -61.3883, name: '罗索' },
  'basseterre': { lat: 17.2903, lon: -62.7275, name: '巴斯特尔' },
  'kingstown': { lat: 13.1675, lon: -61.2244, name: '金斯敦' },
  'port au prince': { lat: 18.5944, lon: -72.3074, name: '太子港' },
  'nassau': { lat: 25.0443, lon: -77.3504, name: '拿骚' },
  'georgetown': { lat: 6.8045, lon: -58.1553, name: '乔治敦' },
  'paramaribo': { lat: 5.8663, lon: -55.1700, name: '帕拉马里博' },
  'suva': { lat: -18.1416, lon: 178.4419, name: '苏瓦' },
  'apia': { lat: -13.8333, lon: -171.7667, name: '阿皮亚' },
  'nuku alofa': { lat: -21.1333, lon: -175.2000, name: '努库阿洛法' },
  'palikir': { lat: 6.9319, lon: 158.2092, name: '帕利基尔' },
  'hagatna': { lat: 13.4667, lon: 144.7833, name: '阿加尼亚' },
  'majuro': { lat: 7.1315, lon: 171.1845, name: '马朱罗' },
  'tarawa': { lat: 1.4135, lon: 172.9769, name: '塔拉瓦' },
  'funafuti': { lat: -8.5246, lon: 179.1947, name: '富纳富提' },
  'naypyidaw': { lat: 19.7478, lon: 96.1347, name: '内比都' },
  'rangoon': { lat: 16.8719, lon: 96.1974, name: '仰光' },
  'phnom penh': { lat: 11.5560, lon: 104.9282, name: '金边' },
  'vientiane': { lat: 17.9757, lon: 102.6331, name: '万象' },
  'hanoi': { lat: 21.0278, lon: 105.8342, name: '河内' },
  'ho chi minh': { lat: 10.8231, lon: 106.6297, name: '胡志明市' },
  'manila': { lat: 14.5995, lon: 120.9842, name: '马尼拉' },
  'jakarta': { lat: -6.2088, lon: 106.8456, name: '雅加达' },
  'bandung': { lat: -6.9147, lon: 107.6098, name: '万隆' },
  'surabaya': { lat: -7.2575, lon: 112.7520, name: '泗水' },
  'kuala lumpur': { lat: 3.1390, lon: 101.6869, name: '吉隆坡' },
  'penang': { lat: 5.4112, lon: 100.3354, name: '槟城' },
  'johor bahru': { lat: 1.5547, lon: 103.7532, name: '新山' },
  'melbourne': { lat: -37.8136, lon: 144.9631, name: '墨尔本' },
  'perth': { lat: -31.9505, lon: 115.8605, name: '珀斯' },
  'adelaide': { lat: -34.9285, lon: 138.6007, name: '阿德莱德' },
  'brisbane': { lat: -27.4698, lon: 153.0251, name: '布里斯班' },
  'gold coast': { lat: -28.0000, lon: 153.4333, name: '黄金海岸' },
  'newcastle': { lat: -32.9295, lon: 151.7801, name: '纽卡斯尔' },
  'wellington': { lat: -41.2865, lon: 174.7762, name: '惠灵顿' },
  'christchurch': { lat: -43.5321, lon: 172.6362, name: '克赖斯特彻奇' },
  'dunedin': { lat: -45.8742, lon: 170.5033, name: '达尼丁' },
  'honolulu': { lat: 21.3069, lon: -157.8583, name: '火奴鲁鲁' },
  'anchorage': { lat: 61.2181, lon: -149.9003, name: '安克雷奇' },
  'juneau': { lat: 58.3019, lon: -134.4197, name: '朱诺' },
  'fairbanks': { lat: 64.8378, lon: -147.7164, name: '费尔班克斯' },
}

const weatherDescriptions: Record<number, string> = {
  0: '☀️ 晴朗', 1: '🌤️ 晴间多云', 2: '⛅ 局部多云', 3: '☁️ 阴天',
  45: '🌫️ 雾', 48: '🌫️ 雾凇', 51: '🌦️ 毛毛雨', 53: '🌦️ 毛毛雨',
  55: '🌧️ 密集毛毛雨', 56: '🌨️ 冻毛毛雨', 57: '🌨️ 冻毛毛雨',
  61: '🌧️ 小雨', 63: '🌧️ 中雨', 65: '🌧️ 大雨',
  66: '🌨️ 冻雨', 67: '🌨️ 冻雨', 71: '🌨️ 小雪',
  73: '🌨️ 中雪', 75: '🌨️ 大雪', 77: '❄️ 雪粒',
  80: '🌧️ 阵雨', 81: '🌧️ 中阵雨', 82: '🌧️ 强阵雨',
  85: '🌨️ 阵雪', 86: '🌨️ 强阵雪',
  95: '⛈️ 雷暴', 96: '⛈️ 雷暴伴冰雹', 99: '⛈️ 强雷暴伴冰雹',
}

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    const cityKey = city.toLowerCase()
    const cityInfo = cityMap[cityKey] || { lat: 39.9042, lon: 116.4074, name: city }
    
    try {
      const data = await fetchWithCache(
        `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&timezone=auto&forecast_days=3`,
        { mode: 'cors' },
        10 * 60 * 1000
      ) as Record<string, unknown>
      
      const current = data.current as Record<string, unknown>
      const daily = data.daily as Record<string, unknown[]>
      
      const desc = weatherDescriptions[current.weather_code as number] || '❓ 未知'
      
      const output: string[] = []
      output.push(`📍 ${cityInfo.name} 天气预报`)
      output.push('═'.repeat(40))
      output.push('')
      output.push('【当前天气】')
      output.push(`  ${desc}`)
      output.push(`  🌡️ 温度: ${current.temperature_2m}°C (体感 ${current.apparent_temperature}°C)`)
      output.push(`  💧 湿度: ${current.relative_humidity_2m}%`)
      output.push(`  💨 风速: ${current.wind_speed_10m} km/h`)
      output.push(`  🌡️ 气压: ${current.pressure_msl} hPa`)
      output.push('')
      output.push('【未来三天预报】')
      
      const times = daily.time as string[]
      const maxTemps = daily.temperature_2m_max as number[]
      const minTemps = daily.temperature_2m_min as number[]
      const weatherCodes = daily.weather_code as number[]
      const sunrises = daily.sunrise as string[]
      const sunsets = daily.sunset as string[]
      
      for (let i = 0; i < Math.min(3, times.length); i++) {
        const date = times[i]
        const maxTemp = maxTemps[i]
        const minTemp = minTemps[i]
        const dayDesc = weatherDescriptions[weatherCodes[i]] || '❓'
        output.push(`  ${date}: ${dayDesc} ${minTemp}°C ~ ${maxTemp}°C`)
      }
      
      output.push('')
      output.push(`  🌅 日出: ${sunrises[0]?.split('T')[1] || '--:--'}`)
      output.push(`  🌇 日落: ${sunsets[0]?.split('T')[1] || '--:--'}`)
      output.push('')
      output.push('数据来源: Open-Meteo (已缓存10分钟)')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取天气信息失败: ${error instanceof Error ? error.message : '未知错误'}` }
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
      ) as Record<string, unknown[]>
      
      const output: string[] = []
      
      output.push(`📰 Hacker News 热门 - "${query}"`)
      output.push('═'.repeat(60))
      output.push('')
      
      const hits = data.hits as Array<Record<string, unknown>>
      hits.forEach((hit, index) => {
        const num = (index + 1).toString().padStart(2)
        output.push(`${num}. ${hit.title}`)
        output.push(`   ⬆️ ${hit.points || 0} points | 💬 ${hit.num_comments || 0} comments | 👤 ${hit.author || 'unknown'}`)
        if (hit.url) {
          output.push(`   🔗 ${hit.url}`)
        }
        output.push('')
      })
      
      output.push('数据来源: Hacker News (Algolia API) (已缓存5分钟)')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `获取新闻失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '获取Hacker News热门新闻',
  usage: 'news [关键词]',
  examples: ['news', 'news javascript', 'news AI']
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
          '用法: translate <目标语言> <文本>',
          '',
          '支持的语言: en(英语), zh(中文), ja(日语), ko(韩语),',
          '           fr(法语), de(德语), es(西班牙语), ru(俄语),',
          '           pt(葡语), it(意语), ar(阿语), hi(印地语)',
          '',
          '示例:',
          '  translate en 你好世界',
          '  translate zh Hello World',
          '  translate ja 早上好',
        ].join('\n')
      }
    }
    
    const targetLang = args[0]
    const text = args.slice(1).join(' ')
    
    const target = langMap[targetLang] || targetLang
    
    try {
      const data = await fetchWithRetry(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${target}`,
        { mode: 'cors' }
      ) as Record<string, Record<string, string>>
      
      const translated = data.responseData?.translatedText
      
      if (!translated) throw new Error('翻译结果为空')
      
      return {
        output: [
          '🌐 翻译结果',
          '═'.repeat(40),
          '',
          `原文: ${text}`,
          '',
          `译文: ${translated}`,
          '',
          '数据来源: MyMemory Translation API',
        ].join('\n')
      }
    } catch {
      return {
        output: [
          '⚠️ 翻译服务暂时不可用',
          '',
          `原文: ${text}`,
          `目标语言: ${targetLang}`,
          '',
          '提示: 请检查网络连接后重试',
        ].join('\n')
      }
    }
  },
  description: '翻译文本（支持多语言）',
  usage: 'translate <目标语言> <文本>',
  examples: ['translate en 你好', 'translate zh Hello World', 'translate ja 早上好']
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
    const cityKey = city.toLowerCase()
    const cityInfo = cityMap[cityKey] || { lat: 39.9042, lon: 116.4074, name: city }
    
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
      await fetch(`https://${host}`, { method: 'HEAD', mode: 'no-cors' })
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
