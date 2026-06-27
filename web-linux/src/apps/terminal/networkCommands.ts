import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('help', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const commands: Record<string, { description: string; usage: string }> = {
      'ls': { description: '列出目录内容', usage: 'ls [选项] [目录]' },
      'cd': { description: '切换目录', usage: 'cd [目录]' },
      'pwd': { description: '显示当前目录', usage: 'pwd' },
      'mkdir': { description: '创建目录', usage: 'mkdir [选项] 目录...' },
      'touch': { description: '创建空文件或更新时间戳', usage: 'touch 文件...' },
      'cat': { description: '显示文件内容', usage: 'cat [选项] 文件...' },
      'rm': { description: '删除文件或目录', usage: 'rm [选项] 文件...' },
      'cp': { description: '复制文件或目录', usage: 'cp [选项] 源 目标' },
      'mv': { description: '移动或重命名文件', usage: 'mv [选项] 源 目标' },
      'grep': { description: '搜索文本', usage: 'grep [选项] 模式 文件...' },
      'find': { description: '查找文件', usage: 'find [路径] [选项]' },
      'whoami': { description: '显示当前用户', usage: 'whoami' },
      'hostname': { description: '显示主机名', usage: 'hostname' },
      'date': { description: '显示日期时间', usage: 'date [格式]' },
      'uname': { description: '显示系统信息', usage: 'uname [选项]' },
      'neofetch': { description: '显示系统信息(ASCII风格)', usage: 'neofetch' },
      'version': { description: '显示版本信息', usage: 'version' },
      'about': { description: '显示关于信息', usage: 'about' },
      'uptime': { description: '显示运行时间', usage: 'uptime' },
      'ps': { description: '显示进程列表', usage: 'ps' },
      'top': { description: '显示进程和资源使用', usage: 'top' },
      'curl': { description: '获取URL内容', usage: 'curl [选项] URL' },
      'fetch': { description: '获取URL内容(简化版)', usage: 'fetch URL' },
      'ping': { description: '测试网络连接', usage: 'ping 主机' },
      'ip': { description: '显示网络接口信息', usage: 'ip [选项]' },
      'ipinfo': { description: '查询IP详细信息', usage: 'ipinfo [IP地址]' },
      'weather': { description: '查询天气', usage: 'weather [城市名]' },
      'news': { description: '获取最新新闻', usage: 'news' },
      'crypto': { description: '查看加密货币行情', usage: 'crypto' },
      'translate': { description: '文本翻译', usage: 'translate <语言> <文本>' },
      'env': { description: '显示环境变量', usage: 'env' },
      'echo': { description: '输出文本', usage: 'echo [选项] 文本' },
      'clear': { description: '清空终端', usage: 'clear' },
      'history': { description: '显示命令历史', usage: 'history' },
      'python': { description: '运行Python脚本', usage: 'python [文件]' },
      'credits': { description: '显示致谢信息', usage: 'credits' },
    }
    
    if (args.length > 0) {
      const cmd = args[0].toLowerCase()
      if (commands[cmd]) {
        const { description, usage } = commands[cmd]
        return {
          output: [
            `命令: ${cmd}`,
            `描述: ${description}`,
            `用法: ${usage}`,
          ].join('\n')
        }
      }
      return { output: `未找到命令: ${cmd}` }
    }
    
    const output = [
      '可用命令列表:',
      '',
      ...Object.entries(commands).map(([name, info]) => 
        `  ${name.padEnd(12)} ${info.description}`
      ),
      '',
      '使用 "help 命令名" 查看详细信息',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示帮助信息',
  usage: 'help [命令名]',
  examples: ['help', 'help ls']
})

registerCommand('echo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    return { output: args.join(' ') }
  },
  description: '输出文本',
  usage: 'echo [文本]',
  examples: ['echo Hello World', 'echo $PATH']
})

registerCommand('env', {
  handler: (): CommandResult => {
    const envVars = {
      HOME: '/home/user',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      SHELL: '/bin/bash',
      TERM: 'xterm-256color',
      USER: 'user',
      LANG: 'zh_CN.UTF-8',
      EDITOR: 'nano',
      PWD: '/home/user',
    }
    
    return {
      output: Object.entries(envVars).map(([key, value]) => 
        `${key}=${value}`
      ).join('\n')
    }
  },
  description: '显示环境变量',
  usage: 'env',
  examples: ['env']
})

registerCommand('clear', {
  handler: (): CommandResult => {
    return { output: '\x1b[2J\x1b[H' }
  },
  description: '清空终端屏幕',
  usage: 'clear',
  examples: ['clear']
})

registerCommand('history', {
  handler: (): CommandResult => {
    const history = [
      'ls -la',
      'cd documents',
      'cat README.md',
      'neofetch',
      'python script.py',
      'git status',
      'npm run build',
      'help',
    ]
    
    return {
      output: history.map((cmd, i) => 
        `${(i + 1).toString().padStart(4)} ${cmd}`
      ).join('\n')
    }
  },
  description: '显示命令历史',
  usage: 'history',
  examples: ['history']
})

registerCommand('curl', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: curl [选项] URL' }
    }
    
    const url = args[args.length - 1]
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { output: `curl: (3) URL使用错误: ${url}` }
    }
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'curl/8.0.0',
        },
        mode: 'cors',
      })
      
      if (!response.ok) {
        return { output: `curl: (${response.status}) ${response.statusText}` }
      }
      
      const text = await response.text()
      const maxLength = 5000
      const truncated = text.length > maxLength 
        ? text.slice(0, maxLength) + '\n\n[输出已截断]'
        : text
      
      return { output: truncated }
    } catch (error) {
      return { output: `curl: (6) 无法解析主机或连接失败: ${url}` }
    }
  },
  description: '获取URL内容',
  usage: 'curl [选项] URL',
  examples: ['curl https://api.example.com', 'curl -I https://example.com']
})

registerCommand('fetch', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: fetch URL' }
    }
    
    const url = args[0]
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { output: `错误: URL必须以http://或https://开头` }
    }
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
      })
      
      const json = await response.json()
      return { output: JSON.stringify(json, null, 2) }
    } catch (error) {
      return { output: `fetch: 无法获取 ${url}` }
    }
  },
  description: '获取URL JSON内容',
  usage: 'fetch URL',
  examples: ['fetch https://api.example.com/data']
})

registerCommand('ping', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: ping 主机' }
    }
    
    const host = args[0]
    const results: string[] = []
    
    // 使用真实网络请求测试延迟
    results.push(`PING ${host}:`)
    
    try {
      // 测试4次连接延迟
      const latencies: number[] = []
      for (let i = 0; i < 4; i++) {
        const startTime = performance.now()
        try {
          // 使用fetch测试真实网络延迟（no-cors模式下response不可读，仅用于计时）
          await fetch(`https://${host}`, { 
            method: 'HEAD', 
            mode: 'no-cors',
            cache: 'no-store'
          })
          const endTime = performance.now()
          const latency = Math.round(endTime - startTime)
          latencies.push(latency)
          results.push(`64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=${latency}ms`)
        } catch {
          // 如果直接fetch失败，尝试DNS解析延迟测试
          const startTime = performance.now()
          await fetch(`https://dns.google/resolve?name=${host}`, { 
            method: 'GET',
            mode: 'cors'
          })
          const endTime = performance.now()
          const latency = Math.round((endTime - startTime) / 2)
          latencies.push(latency)
          results.push(`64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=${latency}ms (DNS测试)`)
        }
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // 统计结果
      const avg = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
      const min = latencies.length > 0 ? Math.min(...latencies) : 0
      const max = latencies.length > 0 ? Math.max(...latencies) : 0
      
      results.push(`--- ${host} ping statistics ---`)
      results.push(`4 packets transmitted, ${latencies.length} received, ${((4 - latencies.length) / 4 * 100).toFixed(1)}% packet loss`)
      results.push(`rtt min/avg/max = ${min}/${avg}/${max} ms`)
    } catch (error) {
      results.push(`ping: 无法连接到 ${host}`)
      results.push('提示: 某些网站可能阻止跨域请求，尝试使用 ipinfo 命令获取网络信息')
    }
    
    return { output: results.join('\n') }
  },
  description: '测试网络连接延迟',
  usage: 'ping 主机',
  examples: ['ping google.com', 'ping github.com']
})

registerCommand('ip', {
  handler: async (): Promise<CommandResult> => {
    const output: string[] = ['网络信息:', '']
    
    try {
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        output.push(`IP地址: ${data.ip || '未知'}`)
        output.push(`城市: ${data.city || '未知'}`)
        output.push(`地区: ${data.region || '未知'}`)
        output.push(`国家: ${data.country_name || '未知'} (${data.country_code || 'N/A'})`)
        output.push(`ISP: ${data.org || '未知'}`)
        output.push(`ASN: ${data.asn || '未知'}`)
        output.push(`时区: ${data.timezone || '未知'}`)
        output.push(`经纬度: ${data.latitude || 'N/A'}, ${data.longitude || 'N/A'}`)
        output.push('')
      } else {
        output.push('无法获取公网IP信息')
        output.push('')
      }
    } catch (error) {
      output.push('网络请求失败，使用备用方法...')
      output.push('')
    }
    
    output.push('=== 浏览器连接信息 ===')
    
    if ('connection' in navigator) {
      const conn = (navigator as unknown as { connection: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } }).connection
      if (conn) {
        output.push(`连接类型: ${conn.effectiveType || '未知'}`)
        output.push(`下行带宽: ${conn.downlink ? `${conn.downlink} Mbps` : '未知'}`)
        output.push(`往返时间(RTT): ${conn.rtt ? `${conn.rtt} ms` : '未知'}`)
        output.push(`数据节省模式: ${conn.saveData ? '启用' : '未启用'}`)
      }
    } else {
      output.push('连接类型: 无法检测 (浏览器不支持)')
    }
    
    output.push('')
    output.push('=== 本地虚拟接口 ===')
    const virtualInterfaces = [
      { name: 'eth0', ip: '192.168.1.100', mask: '255.255.255.0', gateway: '192.168.1.1' },
      { name: 'lo', ip: '127.0.0.1', mask: '255.0.0.0', gateway: '' },
      { name: 'wlan0', ip: '10.0.0.5', mask: '255.255.255.0', gateway: '10.0.0.1' },
    ]
    
    virtualInterfaces.forEach(iface => {
      output.push(`接口: ${iface.name}`)
      output.push(`  IP地址: ${iface.ip}`)
      output.push(`  子网掩码: ${iface.mask}`)
      if (iface.gateway) output.push(`  默认网关: ${iface.gateway}`)
    })
    
    output.push('')
    output.push('DNS服务器: 8.8.8.8 (Google), 1.1.1.1 (Cloudflare)')
    
    return { output: output.join('\n') }
  },
  description: '显示真实网络接口信息',
  usage: 'ip',
  examples: ['ip']
})

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=7453d2a41f7f66d4f4c227ee7d9371e7&units=metric&lang=zh_cn`, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (!response.ok) {
        return { output: `天气查询失败: ${response.statusText}` }
      }
      
      const data = await response.json()
      const output = [
        `🌤️ ${data.name}, ${data.sys.country}`,
        '',
        `天气: ${data.weather[0].description}`,
        `温度: ${Math.round(data.main.temp)}°C (体感 ${Math.round(data.main.feels_like)}°C)`,
        `最高: ${Math.round(data.main.temp_max)}°C / 最低: ${Math.round(data.main.temp_min)}°C`,
        `湿度: ${data.main.humidity}%`,
        `风速: ${data.wind.speed} m/s`,
        `气压: ${data.main.pressure} hPa`,
        `能见度: ${data.visibility ? data.visibility / 1000 : 'N/A'} km`,
        '',
        `🌅 日出: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
        `🌇 日落: ${new Date(data.sys.sunset * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
      ]
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `无法获取天气信息: ${city}` }
    }
  },
  description: '查询天气',
  usage: 'weather [城市名]',
  examples: ['weather Beijing', 'weather Shanghai', 'weather Tokyo']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch(`https://newsapi.org/v2/top-headlines?country=cn&apiKey=7c9f257f34d344dd8a51d60a257094ee&pageSize=5`, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (!response.ok) {
        return { output: `新闻获取失败: ${response.statusText}` }
      }
      
      const data = await response.json()
      if (data.articles.length === 0) {
        return { output: '暂无新闻' }
      }
      
      const output = ['📰 最新新闻:', '']
      data.articles.forEach((article: { title: string; source: { name: string }; publishedAt: string; url: string }, index: number) => {
        const date = new Date(article.publishedAt).toLocaleDateString('zh-CN')
        output.push(`${index + 1}. ${article.title}`)
        output.push(`   来源: ${article.source.name} | ${date}`)
        output.push('')
      })
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: '无法获取新闻信息' }
    }
  },
  description: '获取最新新闻',
  usage: 'news',
  examples: ['news']
})

registerCommand('crypto', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false', {
        method: 'GET',
        mode: 'cors'
      })
      
      if (!response.ok) {
        return { output: `加密货币数据获取失败: ${response.statusText}` }
      }
      
      const data = await response.json()
      const output = ['💰 加密货币行情:', '', '名称'.padEnd(18) + '价格(USD)'.padEnd(18) + '24h涨跌']
      output.push('-'.repeat(50))
      
      data.forEach((coin: { name: string; symbol: string; current_price: number; price_change_percentage_24h: number }) => {
        const price = `$${coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        const change = coin.price_change_percentage_24h >= 0 ? `+${coin.price_change_percentage_24h.toFixed(2)}%` : `${coin.price_change_percentage_24h.toFixed(2)}%`
        output.push(`${coin.name} (${coin.symbol.toUpperCase()})`.padEnd(18) + price.padEnd(18) + change)
      })
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: '无法获取加密货币数据' }
    }
  },
  description: '查看加密货币行情',
  usage: 'crypto',
  examples: ['crypto']
})

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (args.length < 2) {
      return { output: '用法: translate <目标语言> <文本>\n示例: translate zh Hello World\n支持语言: en, zh, ja, ko, fr, de, es, ru' }
    }
    
    const targetLang = args[0]
    const text = args.slice(1).join(' ')
    
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
      const res = await fetch(url, { method: 'GET', mode: 'cors' })
      
      if (!res.ok) {
        return { output: '翻译服务暂时不可用' }
      }
      
      const data = await res.json()
      if (data.responseData && data.responseData.translatedText) {
        return { output: `翻译结果: ${data.responseData.translatedText}` }
      }
      return { output: '无法获取翻译结果' }
    } catch {
      return { output: '翻译失败' }
    }
  },
  description: '文本翻译',
  usage: 'translate <目标语言> <文本>',
  examples: ['translate zh Hello World']
})

registerCommand('ipinfo', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const ip = args[0]
    
    try {
      const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/'
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (!response.ok) {
        return { output: `IP信息查询失败: ${response.statusText}` }
      }
      
      const data = await response.json()
      const output = [
        `IP地址: ${data.ip || '未知'}`,
        `版本: IPv${data.version || 'N/A'}`,
        `类型: ${data.ip_type || 'N/A'}`,
        `城市: ${data.city || '未知'}`,
        `地区: ${data.region || '未知'}`,
        `国家: ${data.country_name || '未知'} (${data.country_code || 'N/A'})`,
        `语言: ${data.languages || '未知'}`,
        `时区: ${data.timezone || '未知'}`,
        `UTC偏移: ${data.utc_offset || '未知'}`,
        `货币: ${data.currency || '未知'} (${data.currency_name || 'N/A'})`,
        `ISP: ${data.org || '未知'}`,
        `ASN: ${data.asn || '未知'}`,
        `Hostname: ${data.hostname || '未知'}`,
        `移动网络: ${data.mobile ? '是' : '否'}`,
        `代理: ${data.proxy ? '是' : '否'}`,
        `VPN: ${data.vpn ? '是' : '否'}`,
      ]
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: '无法获取IP信息' }
    }
  },
  description: '查询IP详细信息',
  usage: 'ipinfo [IP地址]',
  examples: ['ipinfo', 'ipinfo 8.8.8.8']
})
