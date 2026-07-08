import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithCache } from '../../utils/apiCache'

registerCommand('system-status', {
  handler: (context: CommandContext): CommandResult => {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    const usedMemory = memory ? (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A'
    const totalMemory = memory ? (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A'
    const cpuCores = navigator.hardwareConcurrency || 'N/A'
    const userAgent = navigator.userAgent
    const language = navigator.language
    const online = navigator.onLine ? '在线' : '离线'
    const platform = navigator.platform
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height

    const output: string[] = []
    output.push('🖥️ 系统状态')
    output.push('═'.repeat(50))
    output.push('')
    output.push('【资源使用】')
    output.push(`  🧠 内存使用: ${usedMemory} MB / ${totalMemory} MB`)
    output.push(`  📊 CPU核心数: ${cpuCores}`)
    output.push('')
    output.push('【浏览器信息】')
    output.push(`  🌐 语言: ${language}`)
    output.push(`  🔗 网络状态: ${online}`)
    output.push(`  💻 平台: ${platform}`)
    output.push(`  🖼️ 屏幕分辨率: ${screenWidth} × ${screenHeight}`)
    output.push('')
    output.push('【WebLinuxOS信息】')
    output.push(`  👤 当前用户: ${context.username}`)
    output.push(`  🖥️ 主机名: ${context.hostname}`)
    output.push(`  📁 当前目录: ${context.cwd}`)
    output.push(`  🎨 主题: ${context.theme}`)
    output.push('')

    return { output: output.join('\n') }
  },
  description: '显示系统状态和资源使用信息',
  usage: 'system-status',
  examples: ['system-status'],
})

registerCommand('timer', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const seconds = parseInt(args[0]) || 60

    if (seconds <= 0) {
      return { output: '⚠️ 请输入有效的秒数' }
    }

    const output: string[] = []
    output.push(`⏱️ 倒计时开始: ${seconds} 秒`)
    output.push('═'.repeat(50))
    output.push('')
    output.push('倒计时已启动，请保持终端窗口打开')
    output.push('按 Ctrl+C 可取消倒计时')
    output.push('')

    setTimeout(() => {
      const notifyOutput = [
        '',
        '🎉 倒计时结束！',
        `⏱️ ${seconds} 秒已过去`,
        '',
      ].join('\n')
      console.log(notifyOutput)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('倒计时完成', { body: `${seconds} 秒已过去` })
      }
    }, seconds * 1000)

    return { output: output.join('\n') }
  },
  description: '启动倒计时器',
  usage: 'timer <秒数>',
  examples: ['timer 60', 'timer 120', 'timer 300'],
})

registerCommand('pomodoro', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const workMinutes = parseInt(args[0]) || 25
    const breakMinutes = parseInt(args[1]) || 5

    if (workMinutes <= 0 || breakMinutes <= 0) {
      return { output: '⚠️ 请输入有效的分钟数' }
    }

    const output: string[] = []
    output.push('🍅 Pomodoro 番茄钟')
    output.push('═'.repeat(50))
    output.push('')
    output.push(`工作时间: ${workMinutes} 分钟`)
    output.push(`休息时间: ${breakMinutes} 分钟`)
    output.push('')
    output.push('番茄钟已启动，请保持终端窗口打开')
    output.push('工作时间结束后将自动进入休息时间')
    output.push('')

    const startBreak = () => {
      const breakOutput = [
        '',
        '☕ 休息时间开始！',
        `⏱️ ${breakMinutes} 分钟休息`,
        '',
      ].join('\n')
      console.log(breakOutput)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('休息时间', { body: `工作完成！休息 ${breakMinutes} 分钟` })
      }
    }

    setTimeout(() => {
      const workOutput = [
        '',
        '✅ 工作时间结束！',
        `🍅 ${workMinutes} 分钟工作完成`,
        '',
      ].join('\n')
      console.log(workOutput)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('工作完成', { body: `恭喜！${workMinutes} 分钟专注工作完成` })
      }
      setTimeout(startBreak, 1000)
    }, workMinutes * 60 * 1000)

    return { output: output.join('\n') }
  },
  description: '启动Pomodoro番茄钟',
  usage: 'pomodoro [工作分钟] [休息分钟]',
  examples: ['pomodoro', 'pomodoro 25 5', 'pomodoro 45 15'],
})

registerCommand('search-files', {
  handler: (context: CommandContext): CommandResult => {
    const { args, files } = context
    const searchPattern = args.join(' ')

    if (!searchPattern) {
      return { output: '⚠️ 请输入搜索模式' }
    }

    const results: { path: string; name: string; type: string }[] = []

    const searchNode = (node: any, currentPath: string) => {
      const fullPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`
      
      if (node.name.toLowerCase().includes(searchPattern.toLowerCase())) {
        results.push({
          path: fullPath,
          name: node.name,
          type: node.type === 'folder' ? '文件夹' : '文件',
        })
      }

      if (node.type === 'folder' && node.children) {
        node.children.forEach((child: any) => searchNode(child, fullPath))
      }
    }

    searchNode(files[0], '/')

    const output: string[] = []
    output.push(`🔍 文件搜索: "${searchPattern}"`)
    output.push('═'.repeat(50))
    output.push('')

    if (results.length === 0) {
      output.push('未找到匹配的文件或文件夹')
    } else {
      output.push(`找到 ${results.length} 个匹配项:`)
      output.push('')
      results.forEach((result, index) => {
        const icon = result.type === '文件夹' ? '📁' : '📄'
        output.push(`${index + 1}. ${icon} ${result.path}`)
      })
    }

    output.push('')

    return { output: output.join('\n') }
  },
  description: '搜索文件系统中的文件和文件夹',
  usage: 'search-files <搜索模式>',
  examples: ['search-files document', 'search-files .txt', 'search-files project'],
})

registerCommand('world-clock', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const timezones = [
      { name: '北京', timezone: 'Asia/Shanghai', offset: '+08:00' },
      { name: '东京', timezone: 'Asia/Tokyo', offset: '+09:00' },
      { name: '纽约', timezone: 'America/New_York', offset: '-04:00' },
      { name: '伦敦', timezone: 'Europe/London', offset: '+01:00' },
      { name: '巴黎', timezone: 'Europe/Paris', offset: '+02:00' },
      { name: '悉尼', timezone: 'Australia/Sydney', offset: '+10:00' },
      { name: '新加坡', timezone: 'Asia/Singapore', offset: '+08:00' },
      { name: '迪拜', timezone: 'Asia/Dubai', offset: '+04:00' },
    ]

    const output: string[] = []
    output.push('🌍 世界时钟')
    output.push('═'.repeat(50))
    output.push('')

    const now = new Date()
    
    timezones.forEach((tz) => {
      const time = now.toLocaleString('zh-CN', {
        timeZone: tz.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      
      const date = now.toLocaleDateString('zh-CN', {
        timeZone: tz.timezone,
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      })

      const hour = parseInt(time.split(':')[0])
      let status = ''
      if (hour >= 9 && hour < 18) status = '🏢 工作时间'
      else if (hour >= 0 && hour < 6) status = '🌙 深夜'
      else if (hour >= 6 && hour < 9) status = '🌅 早晨'
      else if (hour >= 18 && hour < 22) status = '🌆 傍晚'
      else status = '🌃 夜晚'

      output.push(`${tz.name.padEnd(6)} ${time} ${tz.offset.padStart(7)} ${date} ${status}`)
    })

    output.push('')
    output.push('本地时间: ' + now.toLocaleString('zh-CN'))
    output.push('')

    return { output: output.join('\n') }
  },
  description: '显示全球主要城市时间',
  usage: 'world-clock',
  examples: ['world-clock'],
})

registerCommand('crypto-summary', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,polygon&order=market_cap_desc&per_page=8&page=1&sparkline=false&price_change_percentage=24h',
        { mode: 'cors' },
        60 * 1000
      ) as Array<Record<string, unknown>>

      const output: string[] = []
      output.push('💰 加密货币概览')
      output.push('═'.repeat(70))
      output.push('')
      output.push('名称'.padEnd(12) + '| 价格(USD)'.padEnd(18) + '| 24h涨跌幅'.padEnd(14) + '| 市值排名')
      output.push('-'.repeat(70))

      data.forEach((coin, index) => {
        const name = (coin.name as string).padEnd(12)
        const symbol = coin.symbol as string
        const price = `$${(coin.current_price as number).toLocaleString()}`.padEnd(18)
        const change = coin.price_change_percentage_24h as number
        const changeStr = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`
        const changeColor = change >= 0 ? '\x1b[32m' : '\x1b[31m'
        const rank = `#${coin.market_cap_rank}`

        output.push(`${name}${symbol.padStart(4)} | ${price} | ${changeColor}${changeStr.padEnd(14)}\x1b[0m | ${rank}`)
      })

      output.push('')
      output.push('数据来源: CoinGecko (已缓存1分钟)')
      output.push('')

      return { output: output.join('\n') }
    } catch {
      return { output: '⚠️ 加密货币数据暂时不可用，请检查网络连接' }
    }
  },
  description: '显示主要加密货币实时行情概览',
  usage: 'crypto-summary',
  examples: ['crypto-summary'],
})

registerCommand('news-summary', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://hacker-news.firebaseio.com/v0/topstories.json',
        { mode: 'cors' },
        10 * 60 * 1000
      ) as number[]

      const topStories = data.slice(0, 5)
      const stories: Record<string, unknown>[] = []

      for (const id of topStories) {
        const story = await fetchWithCache(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { mode: 'cors' },
          10 * 60 * 1000
        ) as Record<string, unknown>
        stories.push(story)
      }

      const output: string[] = []
      output.push('📰 Hacker News 热门新闻')
      output.push('═'.repeat(70))
      output.push('')

      stories.forEach((story, index) => {
        const title = story.title as string
        const url = story.url as string
        const score = story.score as number
        const comments = story.descendants as number
        const author = story.by as string

        output.push(`${index + 1}. ${title}`)
        output.push(`   📊 评分: ${score} | 💬 评论: ${comments} | 👤 ${author}`)
        if (url) output.push(`   🔗 ${url}`)
        output.push('')
      })

      output.push('数据来源: Hacker News (已缓存10分钟)')
      output.push('')

      return { output: output.join('\n') }
    } catch {
      return { output: '⚠️ 新闻数据暂时不可用，请检查网络连接' }
    }
  },
  description: '显示Hacker News热门新闻摘要',
  usage: 'news-summary',
  examples: ['news-summary'],
})

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const targetLang = args[0] || 'zh'
    const text = args.slice(1).join(' ')

    if (!text) {
      return { output: '⚠️ 请输入要翻译的文本' }
    }

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`,
        { mode: 'cors' }
      )
      const data = await response.json()

      const translation = data.responseData?.translatedText || '无法翻译'
      const match = data.responseData?.match || 0

      const output: string[] = []
      output.push(`🌐 翻译结果 (${targetLang})`)
      output.push('═'.repeat(50))
      output.push('')
      output.push(`原文: ${text}`)
      output.push(`译文: ${translation}`)
      output.push(`匹配度: ${(match * 100).toFixed(0)}%`)
      output.push('')
      output.push('数据来源: MyMemory Translation API')
      output.push('')

      return { output: output.join('\n') }
    } catch {
      return { output: '⚠️ 翻译服务暂时不可用，请检查网络连接' }
    }
  },
  description: '翻译文本',
  usage: 'translate <目标语言> <文本>',
  examples: ['translate zh Hello world', 'translate en 你好世界', 'translate ja Good morning'],
})

registerCommand('url-shorten', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const url = args.join(' ')

    if (!url) {
      return { output: '⚠️ 请输入要缩短的URL' }
    }

    try {
      const response = await fetch(
        `https://api-ssl.bitly.com/v4/shorten`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 1ee0161d18d147d787b556f7de77d652cbc0c687',
          },
          body: JSON.stringify({ long_url: url }),
        }
      )

      if (!response.ok) {
        throw new Error('Shorten failed')
      }

      const data = await response.json()
      const shortUrl = data.link || '无法生成短链接'

      const output: string[] = []
      output.push('🔗 URL 缩短')
      output.push('═'.repeat(50))
      output.push('')
      output.push(`原始URL: ${url}`)
      output.push(`短链接: ${shortUrl}`)
      output.push('')

      return { output: output.join('\n') }
    } catch {
      try {
        const fallbackResponse = await fetch(
          `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
          { mode: 'cors' }
        )
        const shortUrl = await fallbackResponse.text()

        const output: string[] = []
        output.push('🔗 URL 缩短')
        output.push('═'.repeat(50))
        output.push('')
        output.push(`原始URL: ${url}`)
        output.push(`短链接: ${shortUrl}`)
        output.push('')

        return { output: output.join('\n') }
      } catch {
        return { output: '⚠️ URL缩短服务暂时不可用，请检查网络连接' }
      }
    }
  },
  description: '缩短长URL',
  usage: 'url-shorten <URL>',
  examples: ['url-shorten https://example.com/very/long/path', 'url-shorten https://github.com'],
})