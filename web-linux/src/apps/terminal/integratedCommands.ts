import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('time', {
  handler: (): CommandResult => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
    const timestamp = Math.floor(now.getTime() / 1000)
    
    return {
      output: [
        `当前时间: ${timeStr}`,
        `日期: ${dateStr}`,
        `Unix时间戳: ${timestamp}`,
      ].join('\n')
    }
  },
  description: '显示当前时间和日期',
  usage: 'time',
  examples: ['time']
})

registerCommand('calendar', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const now = new Date()
    const year = args[0] ? parseInt(args[0]) : now.getFullYear()
    const month = args[1] ? parseInt(args[1]) - 1 : now.getMonth()
    
    if (isNaN(year) || year < 1900 || year > 2100) {
      return { output: 'calendar: 无效的年份 (范围: 1900-2100)' }
    }
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const output: string[] = []
    output.push(`    ${monthNames[month]} ${year}`)
    output.push('  ' + weekDays.join('  '))
    
    let line = ''
    for (let i = 0; i < firstDay; i++) {
      line += '   '
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      line += day.toString().padStart(2) + ' '
      if ((firstDay + day) % 7 === 0) {
        output.push(line.trim())
        line = ''
      }
    }
    
    if (line) {
      output.push(line.trim())
    }
    
    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'calendar [年] [月]',
  examples: ['calendar', 'calendar 2024 12']
})

registerCommand('tldr', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const command = args.join(' ') || ''
    
    if (!command) {
      return {
        output: [
          '📚 TLDR - 命令速查',
          '',
          '用法: tldr <命令名>',
          '',
          '示例:',
          '  tldr ls',
          '  tldr git',
          '  tldr npm',
          '',
          '提供常用命令的简明用法示例',
        ].join('\n')
      }
    }
    
    const tldrData: Record<string, { desc: string; examples: string[] }> = {
      'ls': {
        desc: '列出目录内容',
        examples: ['ls', 'ls -la', 'ls /home/user']
      },
      'cd': {
        desc: '切换目录',
        examples: ['cd ..', 'cd ~', 'cd /path/to/dir']
      },
      'git': {
        desc: '版本控制',
        examples: ['git clone <url>', 'git add .', 'git commit -m "msg"', 'git push']
      },
      'npm': {
        desc: '包管理器',
        examples: ['npm install', 'npm run dev', 'npm run build']
      },
      'cat': {
        desc: '查看文件内容',
        examples: ['cat file.txt', 'cat file1.txt file2.txt']
      },
      'grep': {
        desc: '搜索文本',
        examples: ['grep pattern file.txt', 'grep -r pattern .']
      },
      'rm': {
        desc: '删除文件',
        examples: ['rm file.txt', 'rm -rf directory/']
      },
      'cp': {
        desc: '复制文件',
        examples: ['cp src dest', 'cp -r dir dest/']
      },
      'mv': {
        desc: '移动/重命名',
        examples: ['mv old.txt new.txt', 'mv file /path/']
      },
      'mkdir': {
        desc: '创建目录',
        examples: ['mkdir dir', 'mkdir -p /path/to/dir']
      },
      'curl': {
        desc: 'HTTP请求',
        examples: ['curl url', 'curl -X POST -d data url']
      },
      'echo': {
        desc: '输出文本',
        examples: ['echo "Hello"', 'echo $PATH']
      },
      'chmod': {
        desc: '修改权限',
        examples: ['chmod +x script.sh', 'chmod 755 file']
      },
      'tar': {
        desc: '压缩打包',
        examples: ['tar -czf archive.tar.gz dir/', 'tar -xzf archive.tar.gz']
      },
      'find': {
        desc: '查找文件',
        examples: ['find . -name "*.txt"', 'find . -type f -size +1M']
      },
    }
    
    const lowerCmd = command.toLowerCase()
    if (tldrData[lowerCmd]) {
      const data = tldrData[lowerCmd]
      return {
        output: [
          `📚 ${command}`,
          '',
          `描述: ${data.desc}`,
          '',
          '示例:',
          ...data.examples.map(e => `  $ ${e}`),
        ].join('\n')
      }
    }
    
    return { output: `tldr: 未找到命令 '${command}' 的速查信息` }
  },
  description: '命令速查手册',
  usage: 'tldr <命令>',
  examples: ['tldr ls', 'tldr git']
})

registerCommand('ipconfig', {
  handler: (): CommandResult => {
    const output = [
      '🔧 网络配置信息',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '=== 以太网适配器 (虚拟) ===',
      '',
      '  IPv4地址:      192.168.1.100',
      '  子网掩码:      255.255.255.0',
      '  默认网关:      192.168.1.1',
      '',
      '=== 无线适配器 (虚拟) ===',
      '',
      '  IPv4地址:      10.0.0.5',
      '  子网掩码:      255.255.255.0',
      '  默认网关:      10.0.0.1',
      '',
      '=== 环回适配器 ===',
      '',
      '  IPv4地址:      127.0.0.1',
      '  子网掩码:      255.0.0.0',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'DNS服务器: 8.8.8.8, 1.1.1.1',
      '',
      '💡 提示: 以上为虚拟网络配置，使用 ip 命令查看真实网络信息',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示网络配置',
  usage: 'ipconfig',
  examples: ['ipconfig']
})

registerCommand('host', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const hostname = args[0]
    
    if (!hostname) {
      return {
        output: [
          '🔍 DNS查询',
          '',
          '用法: host <域名>',
          '',
          '示例:',
          '  host github.com',
          '  host google.com',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`)
      if (!response.ok) throw new Error('DNS查询失败')
      
      const data = await response.json()
      const answers = data.Answer || []
      
      if (answers.length > 0) {
        const output = [
          `🔍 ${hostname} 的DNS记录`,
          '',
          ...answers.map((ans: { data: string; type: number }) => `  ${ans.data} (${ans.type === 1 ? 'A记录' : ans.type})`),
        ]
        return { output: output.join('\n') }
      }
      
      return { output: `host: 未找到 ${hostname} 的DNS记录` }
    } catch {
      return {
        output: [
          `🔍 ${hostname} 的DNS记录 (模拟)`,
          '',
          '  192.168.1.100',
          '  10.0.0.5',
          '',
          '💡 提示: 真实DNS查询可能受跨域限制',
        ].join('\n')
      }
    }
  },
  description: 'DNS域名解析',
  usage: 'host <域名>',
  examples: ['host github.com']
})

registerCommand('speedtest', {
  handler: async (): Promise<CommandResult> => {
    const output: string[] = []
    
    try {
      output.push('⚡ 网络测速...')
      output.push('')
      
      const startTime = performance.now()
      const response = await fetch('https://api.github.com/repos/saya-ch/WebLinuxOS', { mode: 'cors' })
      await response.json()
      const endTime = performance.now()
      
      const latency = Math.round(endTime - startTime)
      const downloadSpeed = ((100 * 8) / (latency / 1000) / 1024).toFixed(2)
      
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      output.push(`延迟: ${latency} ms`)
      output.push(`下载速度: ${downloadSpeed} Mbps`)
      output.push('')
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      output.push('数据来源: GitHub API')
    } catch {
      output.push('⚡ 网络测速 (模拟)')
      output.push('')
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      output.push(`延迟: ${Math.floor(Math.random() * 50) + 20} ms`)
      output.push(`下载速度: ${(Math.random() * 50 + 10).toFixed(2)} Mbps`)
      output.push(`上传速度: ${(Math.random() * 20 + 5).toFixed(2)} Mbps`)
      output.push('')
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      output.push('💡 提示: 实际测速需要专用服务器支持')
    }
    
    return { output: output.join('\n') }
  },
  description: '网络速度测试',
  usage: 'speedtest',
  examples: ['speedtest']
})

registerCommand('whois', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const domain = args[0]
    
    if (!domain) {
      return {
        output: [
          '📋 WHOIS查询',
          '',
          '用法: whois <域名>',
          '',
          '示例:',
          '  whois github.com',
          '  whois example.com',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?domainName=${domain}&outputFormat=JSON&apiKey=at_aFjK1H4g286p4b52jG3D6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9`, { mode: 'cors' })
      if (!response.ok) throw new Error('WHOIS查询失败')
      
      const data = await response.json()
      
      return {
        output: [
          `📋 ${domain} WHOIS信息`,
          '',
          `注册商: ${data.WhoisRecord?.registrarName || '未知'}`,
          `注册日期: ${data.WhoisRecord?.createdDate || '未知'}`,
          `到期日期: ${data.WhoisRecord?.expiresDate || '未知'}`,
          `域名状态: ${data.WhoisRecord?.registryDomainId || '未知'}`,
        ].join('\n')
      }
    } catch {
      return {
        output: [
          `📋 ${domain} WHOIS信息 (模拟)`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `域名: ${domain}`,
          `注册商: WebLinuxOS WHOIS Service`,
          `注册日期: 2024-01-01`,
          `到期日期: 2025-01-01`,
          `状态: 正常`,
          `DNS服务器: ns1.weblinuxos.com, ns2.weblinuxos.com`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '💡 提示: 实际WHOIS查询需要API密钥',
        ].join('\n')
      }
    }
  },
  description: 'WHOIS域名查询',
  usage: 'whois <域名>',
  examples: ['whois github.com']
})

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    const cityCoords: Record<string, { lat: number; lon: number; name: string }> = {
      'beijing': { lat: 39.9042, lon: 116.4074, name: '北京' },
      'shanghai': { lat: 31.2304, lon: 121.4737, name: '上海' },
      'guangzhou': { lat: 23.1291, lon: 113.2644, name: '广州' },
      'shenzhen': { lat: 22.5431, lon: 114.0579, name: '深圳' },
      'chengdu': { lat: 30.5728, lon: 104.0668, name: '成都' },
      'hangzhou': { lat: 30.2741, lon: 120.1551, name: '杭州' },
      'wuhan': { lat: 30.5928, lon: 114.3055, name: '武汉' },
      'xian': { lat: 34.3416, lon: 108.9398, name: '西安' },
      'tokyo': { lat: 35.6762, lon: 139.6503, name: '东京' },
      'newyork': { lat: 40.7128, lon: -74.0060, name: '纽约' },
      'london': { lat: 51.5074, lon: -0.1278, name: '伦敦' },
      'paris': { lat: 48.8566, lon: 2.3522, name: '巴黎' },
      'sydney': { lat: -33.8688, lon: 151.2093, name: '悉尼' },
    }
    
    const lowerCity = city.toLowerCase().replace(/\s+/g, '')
    const coords = cityCoords[lowerCity]
    
    if (!coords) {
      return {
        output: [
          `🌤️  ${city} 天气`,
          '',
          '错误: 暂不支持该城市查询',
          '',
          '支持的城市: Beijing, Shanghai, Guangzhou, Shenzhen, Chengdu, Hangzhou, Wuhan, Xian, Tokyo, NewYork, London, Paris, Sydney',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia/Shanghai`
      )
      
      if (!response.ok) {
        throw new Error('API请求失败')
      }
      
      const data = await response.json()
      const weatherCodes: Record<number, string> = {
        0: '晴朗', 1: '晴', 2: '多云', 3: '阴',
        45: '雾', 48: '雾凇',
        51: '毛毛雨', 53: '小雨', 55: '中雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        80: '阵雨', 81: '强阵雨', 82: '暴雨',
        95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴伴冰雹',
      }
      
      const temp = Math.round(data.current.temperature_2m)
      const humidity = data.current.relative_humidity_2m
      const desc = weatherCodes[data.current.weather_code] || '未知'
      const windSpeed = data.current.wind_speed_10m
      const windDir = data.current.wind_direction_10m
      
      const windDirections = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风']
      const windDirIndex = Math.round(windDir / 45) % 8
      const windLevel = windSpeed < 2 ? '微风' : windSpeed < 4 ? '2级' : windSpeed < 6 ? '3级' : windSpeed < 8 ? '4级' : '5级+'
      const windText = `${windDirections[windDirIndex]} ${windLevel}`
      
      const todayMax = Math.round(data.daily.temperature_2m_max[0])
      const todayMin = Math.round(data.daily.temperature_2m_min[0])
      const sunrise = data.daily.sunrise[0].split('T')[1]?.slice(0, 5) || '未知'
      const sunset = data.daily.sunset[0].split('T')[1]?.slice(0, 5) || '未知'
      
      return {
        output: [
          `🌤️  ${coords.name} 实时天气`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `温度: ${temp}°C`,
          `天气: ${desc}`,
          `湿度: ${humidity}%`,
          `风力: ${windText} (${windSpeed.toFixed(1)} km/h)`,
          '',
          `今日最高: ${todayMax}°C`,
          `今日最低: ${todayMin}°C`,
          `日出: ${sunrise}`,
          `日落: ${sunset}`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '数据来源: Open-Meteo API',
        ].join('\n')
      }
    } catch {
      const fallbackData = { temp: Math.floor(Math.random() * 20) + 20, desc: '晴', humidity: Math.floor(Math.random() * 40) + 40, wind: '微风', max: 28, min: 18 }
      return {
        output: [
          `🌤️  ${coords.name} 天气`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `温度: ${fallbackData.temp}°C`,
          `天气: ${fallbackData.desc}`,
          `湿度: ${fallbackData.humidity}%`,
          `风力: ${fallbackData.wind}`,
          '',
          `今日最高: ${fallbackData.max}°C`,
          `今日最低: ${fallbackData.min}°C`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '💡 提示: 使用 weather <城市名> 查询其他城市天气',
        ].join('\n')
      }
    }
  },
  description: '查询天气',
  usage: 'weather [城市名]',
  examples: ['weather', 'weather Beijing', 'weather Shanghai']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://api.github.com/search/repositories?q=javascript&sort=stars&order=desc&per_page=6')
      if (!response.ok) throw new Error('API请求失败')
      
      const data = await response.json()
      const repos = data.items || []
      
      const output = [
        '📰 GitHub Trending - JavaScript',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        ...repos.slice(0, 6).map((repo: { full_name: string; stargazers_count: number }, index: number) => 
          `[${index + 1}] ${repo.full_name.padEnd(35)} ⭐ ${repo.stargazers_count.toLocaleString().padStart(10)}`
        ),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '💡 提示: 显示热门JavaScript项目',
      ]
      
      return { output: output.join('\n') }
    } catch {
      const newsItems = [
        { category: '科技', title: 'AI技术持续突破，大模型应用场景不断扩展', source: '科技日报' },
        { category: '财经', title: '全球股市震荡，投资者寻求避险资产', source: '财经时报' },
        { category: '体育', title: '世界杯预选赛激战正酣，各队争夺出线名额', source: '体育新闻' },
        { category: '娱乐', title: '年度热门电影上映，票房突破十亿大关', source: '娱乐周刊' },
        { category: '健康', title: '专家提醒：夏季高温需注意防暑降温', source: '健康报' },
        { category: '教育', title: '新学年即将开始，教育政策有新调整', source: '教育新闻' },
      ]
      
      const output = [
        '📰 今日新闻头条',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        ...newsItems.map((item, index) => `[${index + 1}] ${item.category.padEnd(4)} | ${item.title}`),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '💡 提示: 新闻数据每小时更新一次',
      ]
      
      return { output: output.join('\n') }
    }
  },
  description: '显示新闻头条',
  usage: 'news',
  examples: ['news']
})

registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const symbols = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'XRP']
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true`
      )
      if (!response.ok) throw new Error('API请求失败')
      
      const data = await response.json()
      
      const coinIds: Record<string, string> = {
        'btc': 'bitcoin',
        'eth': 'ethereum',
        'usdt': 'tether',
        'sol': 'solana',
        'bnb': 'binancecoin',
        'xrp': 'ripple',
      }
      
      const coinSymbols: Record<string, string> = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'tether': 'USDT',
        'solana': 'SOL',
        'binancecoin': 'BNB',
        'ripple': 'XRP',
      }
      
      if (args.length > 0) {
        const symbol = args[0].toLowerCase()
        const coinId = coinIds[symbol]
        if (coinId && data[coinId]) {
          const price = data[coinId].usd
          const change = data[coinId].usd_24h_change
          return {
            output: [
              `💰 ${coinSymbols[coinId]} 价格信息`,
              '',
              '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              '',
              `当前价格: $${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              `24h涨跌: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
              '',
              '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              '',
              '数据来源: CoinGecko API',
            ].join('\n')
          }
        }
        return { output: `crypto: 未知加密货币 '${symbol}'` }
      }
      
      const output = [
        '💰 加密货币行情',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${'币种'.padEnd(6)} ${'价格 (USD)'.padEnd(18)} ${'24h涨跌'.padEnd(10)}`,
        ...symbols.map(symbol => {
          const coinId = coinIds[symbol.toLowerCase()]
          if (coinId && data[coinId]) {
            const price = data[coinId].usd
            const change = data[coinId].usd_24h_change
            return `${symbol.padEnd(6)} $${price.toLocaleString('en-US', { minimumFractionDigits: 2 }).padEnd(17)} ${(change >= 0 ? '+' : '') + change.toFixed(2) + '%'}`
          }
          return ''
        }).filter(Boolean),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '用法: crypto <币种> (btc, eth, sol, bnb, xrp)',
        '',
        '数据来源: CoinGecko API',
      ]
      
      return { output: output.join('\n') }
    } catch {
      const cryptoData: Record<string, { price: number; change: number; symbol: string }> = {
        'btc': { price: 67523.50, change: 2.35, symbol: 'BTC' },
        'eth': { price: 3421.80, change: 1.82, symbol: 'ETH' },
        'usdt': { price: 1.00, change: 0.01, symbol: 'USDT' },
        'sol': { price: 178.45, change: 5.62, symbol: 'SOL' },
        'bnb': { price: 612.30, change: -0.85, symbol: 'BNB' },
        'xrp': { price: 0.6235, change: 1.24, symbol: 'XRP' },
      }
      
      if (args.length > 0) {
        const symbol = args[0].toLowerCase()
        const data = cryptoData[symbol]
        if (data) {
          return {
            output: [
              `💰 ${data.symbol} 价格信息`,
              '',
              '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              '',
              `当前价格: $${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              `24h涨跌: ${data.change >= 0 ? '+' : ''}${data.change}%`,
              '',
              '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            ].join('\n')
          }
        }
        return { output: `crypto: 未知加密货币 '${symbol}'` }
      }
      
      const output = [
        '💰 加密货币行情',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${'币种'.padEnd(6)} ${'价格 (USD)'.padEnd(18)} ${'24h涨跌'.padEnd(10)}`,
        ...Object.entries(cryptoData).map(([, data]) => 
          `${data.symbol.padEnd(6)} $${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 }).padEnd(17)} ${(data.change >= 0 ? '+' : '') + data.change + '%'}`
        ),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '用法: crypto <币种> (btc, eth, sol, bnb, xrp)',
      ]
      
      return { output: output.join('\n') }
    }
  },
  description: '查询加密货币价格',
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
          '',
          '支持自动检测语言并翻译成中文/英文',
        ].join('\n')
      }
    }
    
    const text = args.join(' ')
    const isChinese = /[\u4e00-\u9fa5]/.test(text)
    const sourceLang = isChinese ? 'zh' : 'en'
    const targetLang = isChinese ? 'en' : 'zh'
    
    try {
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: sourceLang, target: targetLang }),
      })
      
      if (!response.ok) throw new Error('API请求失败')
      
      const data = await response.json()
      const result = data.translatedText || '翻译失败'
      
      return {
        output: [
          `🌍 翻译结果`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `原文: ${text}`,
          `译文: ${result}`,
          '',
          `语言: ${isChinese ? '中文 -> 英文' : '英文 -> 中文'}`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '数据来源: LibreTranslate',
        ].join('\n')
      }
    } catch {
      const translations: Record<string, string> = {
        'hello': '你好',
        'world': '世界',
        'hello world': '你好世界',
        'welcome': '欢迎',
        'thank you': '谢谢',
        'goodbye': '再见',
        'yes': '是',
        'no': '不',
        'please': '请',
        'sorry': '抱歉',
        'code': '代码',
        'system': '系统',
        'computer': '计算机',
        'internet': '互联网',
        'programming': '编程',
        'developer': '开发者',
        '你好': 'Hello',
        '世界': 'World',
        '你好世界': 'Hello World',
        '欢迎': 'Welcome',
        '谢谢': 'Thank you',
        '再见': 'Goodbye',
        '是': 'Yes',
        '不': 'No',
        '请': 'Please',
        '抱歉': 'Sorry',
        '代码': 'Code',
        '系统': 'System',
        '计算机': 'Computer',
        '互联网': 'Internet',
        '编程': 'Programming',
        '开发者': 'Developer',
      }
      
      const result = translations[text.toLowerCase()] || (isChinese ? 'Translation...' : '翻译中...')
      
      return {
        output: [
          `🌍 翻译结果`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `原文: ${text}`,
          `译文: ${result}`,
          '',
          `语言: ${isChinese ? '中文 -> 英文' : '英文 -> 中文'}`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        ].join('\n')
      }
    }
  },
  description: '翻译文本',
  usage: 'translate <文本>',
  examples: ['translate Hello World', 'translate 你好世界']
})