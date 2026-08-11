import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('stock', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          'stock - 查询股票信息',
          '',
          '用法: stock <股票代码>',
          '',
          '示例:',
          '  stock AAPL',
          '  stock TSLA',
          '  stock 600519.SS',
          '',
          '支持的市场代码:',
          '  美股: AAPL, GOOGL, MSFT, TSLA, AMZN',
          '  A股: 600519.SS (上海), 000001.SZ (深圳)',
        ].join('\n')
      }
    }
    
    const symbol = args[0].toUpperCase()
    
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`)
      const data = await response.json()
      
      const meta = data?.chart?.result?.[0]?.meta
      if (!meta) {
        return { output: `stock: 无法获取 ${symbol} 的数据，请检查股票代码是否正确` }
      }
      
      const price = meta.regularMarketPrice
      const previousClose = meta.chartPreviousClose || meta.previousClose
      const change = price - previousClose
      const changePercent = (change / previousClose) * 100
      const direction = change >= 0 ? '+' : ''
      
      const output = [
        `股票代码: ${meta.symbol}`,
        `名称:     ${meta.longName || meta.shortName || '未知'}`,
        '',
        `当前价格: $${price.toFixed(2)}`,
        `涨跌幅:   ${direction}${change.toFixed(2)} (${direction}${changePercent.toFixed(2)}%)`,
        `前收盘价: $${previousClose.toFixed(2)}`,
        `今日开盘: $${meta.regularMarketOpen?.toFixed(2) || 'N/A'}`,
        `今日最高: $${meta.regularMarketDayHigh?.toFixed(2) || 'N/A'}`,
        `今日最低: $${meta.regularMarketDayLow?.toFixed(2) || 'N/A'}`,
        `成交量:   ${meta.regularMarketVolume?.toLocaleString() || 'N/A'}`,
        '',
        `货币:     ${meta.currency}`,
        `交易所:   ${meta.fullExchangeName}`,
      ]
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          `stock: 无法获取 ${symbol} 的数据`,
          '',
          '提示: Yahoo Finance API 可能限制跨域访问',
          '可尝试使用其他股票代码或稍后重试',
        ].join('\n')
      }
    }
  },
  description: '查询股票实时行情',
  usage: 'stock <股票代码>',
  examples: ['stock AAPL', 'stock TSLA', 'stock 600519.SS']
})

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0 || args[0] === 'list') {
      const currencies = [
        'USD - 美元', 'EUR - 欧元', 'CNY - 人民币', 'JPY - 日元',
        'GBP - 英镑', 'HKD - 港币', 'AUD - 澳元', 'CAD - 加元',
        'KRW - 韩元', 'SGD - 新加坡元', 'CHF - 瑞士法郎', 'THB - 泰铢',
      ]
      return {
        output: [
          'currency - 货币汇率查询',
          '',
          '支持的货币代码:',
          ...currencies.map(c => `  ${c}`),
          '',
          '用法: currency <基础货币> [目标货币] [金额]',
          '',
          '示例:',
          '  currency USD CNY 100',
          '  currency EUR USD',
          '  currency list',
        ].join('\n')
      }
    }
    
    const base = args[0].toUpperCase()
    const target = (args[1] || 'CNY').toUpperCase()
    const amount = parseFloat(args[2]) || 1
    
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${base}`)
      const data = await response.json()
      
      if (data.result !== 'success' || !data.rates) {
        return { output: `currency: 无法获取汇率数据` }
      }
      
      const rate = data.rates[target]
      if (!rate) {
        return {
          output: [
            `currency: 不支持的目标货币 "${target}"`,
            '',
            `可用货币: ${Object.keys(data.rates).slice(0, 20).join(', ')}...`,
          ].join('\n')
        }
      }
      
      const converted = amount * rate
      
      const output = [
        `货币汇率查询`,
        '',
        `${amount} ${base} = ${converted.toFixed(4)} ${target}`,
        `1 ${base} = ${rate.toFixed(4)} ${target}`,
        `1 ${target} = ${(1 / rate).toFixed(4)} ${base}`,
        '',
        `更新时间: ${data.time_last_update_utc}`,
        `数据来源: ExchangeRate-API`,
      ]
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          `currency: 无法获取汇率数据`,
          '',
          '提示: 请检查网络连接，或稍后重试',
        ].join('\n')
      }
    }
  },
  description: '查询货币汇率',
  usage: 'currency <基础货币> [目标货币] [金额]',
  examples: ['currency USD CNY 100', 'currency EUR USD', 'currency list']
})

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0 || args[0] === 'list') {
      const languages = [
        'auto   - 自动检测', 'zh     - 中文', 'en     - 英语',
        'ja     - 日语', 'ko     - 韩语', 'fr     - 法语',
        'de     - 德语', 'es     - 西班牙语', 'ru     - 俄语',
        'it     - 意大利语', 'pt     - 葡萄牙语', 'ar     - 阿拉伯语',
      ]
      return {
        output: [
          'translate - 文本翻译',
          '',
          '支持的语言代码:',
          ...languages.map(l => `  ${l}`),
          '',
          '用法: translate <源语言> <目标语言> <文本>',
          '',
          '示例:',
          '  translate en zh Hello World',
          '  translate zh en 你好世界',
          '  translate auto ja 今天天气真好',
        ].join('\n')
      }
    }
    
    const from = args[0]
    const to = args[1]
    const text = args.slice(2).join(' ')
    
    if (!text) {
      return { output: 'translate: 请提供要翻译的文本' }
    }
    
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`)
      const data = await response.json()
      
      if (data && data[0]) {
        const translated = data[0].map((item: [string]) => item[0]).join('')
        
        const output = [
          `翻译结果`,
          '',
          `源语言: ${from}`,
          `目标语言: ${to}`,
          '',
          `原文: ${text}`,
          `译文: ${translated}`,
        ]
        
        return { output: output.join('\n') }
      } else {
        return { output: 'translate: 翻译失败，请稍后重试' }
      }
    } catch {
      return { output: 'translate: 网络错误，无法完成翻译' }
    }
  },
  description: '文本翻译服务',
  usage: 'translate <源语言> <目标语言> <文本>',
  examples: ['translate en zh Hello', 'translate zh en 你好']
})

registerCommand('joke', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const category = args[0] || 'Any'
    
    try {
      const response = await fetch(`https://v2.jokeapi.dev/joke/${category}?safe-mode`)
      const data = await response.json()
      
      if (data.error) {
        return { output: `joke: ${data.message || '获取笑话失败'}` }
      }
      
      let joke: string
      if (data.type === 'single') {
        joke = data.joke
      } else {
        joke = `${data.setup}\n\n${data.delivery}`
      }
      
      const output = [
        `[${data.category}]`,
        '',
        joke,
        '',
        `— 来自 JokeAPI`,
      ]
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          'joke: 无法获取笑话',
          '',
          '提示: 请检查网络连接',
        ].join('\n')
      }
    }
  },
  description: '获取随机笑话',
  usage: 'joke [分类]',
  examples: ['joke', 'joke Programming', 'joke Misc']
})

registerCommand('quote', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://api.quotable.io/random')
      const data = await response.json()
      
      const output = [
        '每日一言',
        '',
        `"${data.content}"`,
        '',
        `— ${data.author}`,
      ]
      
      return { output: output.join('\n') }
    } catch {
      try {
        const fallbackResponse = await fetch('https://zenquotes.io/api/random')
        const fallbackData = await fallbackResponse.json()
        
        if (Array.isArray(fallbackData) && fallbackData.length > 0) {
          const output = [
            '每日一言',
            '',
            `"${fallbackData[0].q}"`,
            '',
            `— ${fallbackData[0].a}`,
          ]
          return { output: output.join('\n') }
        }
        
        return { output: 'quote: 无法获取名言' }
      } catch {
        return { output: 'quote: 网络错误，无法获取名言' }
      }
    }
  },
  description: '获取随机名言',
  usage: 'quote',
  examples: ['quote']
})

registerCommand('hackernews', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const limit = parseInt(args[0]) || 10
    
    if (limit < 1 || limit > 30) {
      return { output: 'hackernews: 请指定 1-30 之间的数量\n用法: hackernews [数量]' }
    }
    
    try {
      const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      const storyIds = await response.json()
      
      const stories: Array<{ id: number; title: string; url?: string; score: number; by: string }> = []
      const count = Math.min(limit, storyIds.length)
      
      const batchSize = 5
      for (let i = 0; i < count; i += batchSize) {
        const batch = storyIds.slice(i, i + batchSize)
        const results = await Promise.all(
          batch.map(async (id: number) => {
            try {
              const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
              return res.json()
            } catch {
              return null
            }
          })
        )
        for (const r of results) {
          if (r) stories.push(r)
        }
      }
      
      const output = [
        `Hacker News 热门话题 (Top ${count})`,
        '',
      ]
      
      stories.slice(0, count).forEach((story, i) => {
        output.push(`${i + 1}. ${story.title}`)
        output.push(`   Score: ${story.score} | By: ${story.by}`)
        if (story.url) {
          output.push(`   URL: ${story.url}`)
        }
        output.push('')
      })
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          'hackernews: 无法获取 Hacker News 数据',
          '',
          '提示: 请检查网络连接',
        ].join('\n')
      }
    }
  },
  description: '获取Hacker News热门话题',
  usage: 'hackernews [数量]',
  examples: ['hackernews', 'hackernews 5']
})

registerCommand('news', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const category = args[0] || 'technology'
    
    const validCategories = ['technology', 'business', 'science', 'sports', 'health', 'entertainment']
    
    if (args[0] === 'list') {
      return {
        output: [
          'news - 新闻资讯',
          '',
          '支持的分类:',
          ...validCategories.map(c => `  ${c}`),
          '',
          '用法: news [分类]',
          '',
          '示例:',
          '  news technology',
          '  news science',
        ].join('\n')
      }
    }
    
    if (!validCategories.includes(category)) {
      return { output: `news: 不支持的分类 "${category}"\n支持: ${validCategories.join(', ')}` }
    }
    
    try {
      const response = await fetch(`https://newsdata.io/api/1/news?apikey=pub_demo&q=${encodeURIComponent(category)}&language=zh&size=5`)
      
      if (!response.ok) {
        throw new Error('API rate limit or authentication error')
      }
      
      const data = await response.json()
      const results = data.results || []
      
      if (results.length === 0) {
        return {
          output: [
            `news - ${category}`,
            '',
            '暂无新闻数据',
            '',
            '试用 HackerNews: hackernews 5',
          ].join('\n')
        }
      }
      
      const output = [`新闻资讯 - ${category}`, '']
      results.forEach((item: { title: string; description?: string; link: string; pubDate?: string }, i: number) => {
        output.push(`${i + 1}. ${item.title}`)
        if (item.description) {
          output.push(`   ${item.description.substring(0, 100)}`)
        }
        output.push(`   链接: ${item.link}`)
        if (item.pubDate) {
          output.push(`   时间: ${item.pubDate}`)
        }
        output.push('')
      })
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          `news - ${category}`,
          '',
          '新闻 API 当前受限，请尝试使用 hackernews 命令',
          '',
          '替代方案: hackernews 10',
        ].join('\n')
      }
    }
  },
  description: '获取新闻资讯',
  usage: 'news [分类]',
  examples: ['news technology', 'news science', 'news list']
})

registerCommand('github', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0 || args[0] === 'help') {
      return {
        output: [
          'github - GitHub 信息查询',
          '',
          '用法:',
          '  github user <用户名>    - 查询用户信息',
          '  github repo <所有者/仓库> - 查询仓库信息',
          '  github trending [语言]  - 获取热门仓库',
          '',
          '示例:',
          '  github user torvalds',
          '  github repo facebook/react',
          '  github trending typescript',
        ].join('\n')
      }
    }
    
    const subcommand = args[0]
    
    if (subcommand === 'user' && args[1]) {
      try {
        const response = await fetch(`https://api.github.com/users/${encodeURIComponent(args[1])}`)
        const data = await response.json()
        
        if (data.message) {
          return { output: `github: ${data.message}` }
        }
        
        const output = [
          `GitHub 用户: ${data.login}`,
          '',
          `名称:     ${data.name || 'N/A'}`,
          `简介:     ${data.bio || 'N/A'}`,
          `位置:     ${data.location || 'N/A'}`,
          `公司:     ${data.company || 'N/A'}`,
          `博客:     ${data.blog || 'N/A'}`,
          '',
          `关注者:   ${data.followers}`,
          `关注中:   ${data.following}`,
          `仓库数:   ${data.public_repos}`,
          `Gists:    ${data.public_gists}`,
          '',
          `创建时间: ${new Date(data.created_at).toLocaleDateString('zh-CN')}`,
          `主页:     ${data.html_url}`,
        ]
        
        return { output: output.join('\n') }
      } catch {
        return { output: 'github: 无法获取用户信息' }
      }
    }
    
    if (subcommand === 'repo' && args[1]) {
      try {
        const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(args[1])}`)
        const data = await response.json()
        
        if (data.message) {
          return { output: `github: ${data.message}` }
        }
        
        const output = [
          `GitHub 仓库: ${data.full_name}`,
          '',
          `描述:     ${data.description || 'N/A'}`,
          `语言:     ${data.language || 'N/A'}`,
          `许可证:   ${data.license?.name || 'N/A'}`,
          '',
          `Stars:    ${data.stargazers_count}`,
          `Forks:    ${data.forks_count}`,
          `Watchers: ${data.watchers_count}`,
          `Issues:   ${data.open_issues_count}`,
          '',
          `创建时间: ${new Date(data.created_at).toLocaleDateString('zh-CN')}`,
          `更新时间: ${new Date(data.updated_at).toLocaleDateString('zh-CN')}`,
          `主页:     ${data.html_url}`,
        ]
        
        return { output: output.join('\n') }
      } catch {
        return { output: 'github: 无法获取仓库信息' }
      }
    }
    
    if (subcommand === 'trending') {
      const lang = args[1]
      try {
        const url = lang 
          ? `https://api.github.com/search/repositories?q=stars:>1000+language:${encodeURIComponent(lang)}&sort=stars&order=desc&per_page=10`
          : 'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=10'
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.message) {
          return { output: `github: ${data.message}` }
        }
        
        const output = lang 
          ? [`GitHub 热门仓库 (${lang})`, '']
          : ['GitHub 热门仓库', '']
        
        data.items?.forEach((repo: { full_name: string; description?: string; stargazers_count: number; forks_count: number }, i: number) => {
          output.push(`${i + 1}. ${repo.full_name} ⭐${repo.stargazers_count}`)
          if (repo.description) {
            output.push(`   ${repo.description.substring(0, 80)}`)
          }
          output.push(`   Forks: ${repo.forks_count}`)
          output.push('')
        })
        
        return { output: output.join('\n') }
      } catch {
        return { output: 'github: 无法获取热门仓库' }
      }
    }
    
    return { output: 'github: 未知子命令\n用法: github [help]' }
  },
  description: 'GitHub 信息查询',
  usage: 'github <user|repo|trending> [参数]',
  examples: ['github user torvalds', 'github repo facebook/react']
})

// 注意：color, uuid, base64, hash, qr 命令已在 toolCommands.ts / workbenchCommands.ts 中注册
// 此处不再重复注册，避免重复定义被静默跳过
