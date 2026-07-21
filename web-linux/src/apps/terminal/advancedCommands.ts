import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'

registerCommand('dictionary', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const word = args.join(' ')
    
    if (!word) {
      return {
        output: [
          '📖 词典查询',
          '',
          '用法: dictionary <单词>',
          '',
          '示例:',
          '  dictionary hello',
          '  dictionary computer',
          '  dictionary programming',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.dictionaryApi.baseUrl}/entries/en/${word}`)
      
      if (!response.ok) {
        throw new Error('查询失败')
      }
      
      const data = await response.json()
      
      if (!Array.isArray(data) || data.length === 0) {
        return { output: `dictionary: 未找到单词 '${word}'` }
      }
      
      const entry = data[0]
      const meanings = entry.meanings?.[0]
      
      return {
        output: [
          `📖 ${entry.word || word}`,
          '',
          `音标: ${entry.phonetic || ''} ${entry.phonetics?.[0]?.audio ? `(${entry.phonetics[0].audio})` : ''}`,
          '',
          ...(meanings?.definitions?.slice(0, 3) || []).map((def: { definition: string; example?: string }, index: number) => [
            `${index + 1}. ${def.definition}`,
            def.example ? `   例: ${def.example}` : '',
          ].filter(Boolean)),
          '',
          `词性: ${meanings?.partOfSpeech || '未知'}`,
          '',
          '数据来源: Dictionary API',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '📖 词典查询',
          '',
          handleApiError(error, '词典API'),
          '',
          '用法: dictionary <单词>',
        ].join('\n')
      }
    }
  },
  description: '查询英文单词释义',
  usage: 'dictionary <单词>',
  examples: ['dictionary hello', 'dictionary code']
})

registerCommand('chuck', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.chuckNorris}/random`, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          '🤠 Chuck Norris 笑话',
          '',
          data.value || '暂无笑话',
          '',
          `分类: ${data.categories?.join(', ') || '普通'}`,
          '数据来源: Chuck Norris API',
        ].join('\n')
      }
    } catch (error) {
      const fallbackJokes = [
        'Chuck Norris 可以除以零。',
        'Chuck Norris 可以在停电时打开灯。',
        'Chuck Norris 可以让石头哭泣。',
        'Chuck Norris 可以在下雨时保持干燥。',
        'Chuck Norris 可以让时间倒流。',
      ]
      
      return {
        output: [
          '🤠 Chuck Norris 笑话',
          '',
          fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)],
          '',
          handleApiError(error, 'Chuck Norris API'),
        ].join('\n')
      }
    }
  },
  description: '获取Chuck Norris笑话',
  usage: 'chuck',
  examples: ['chuck']
})

registerCommand('pokemon', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ') || Math.floor(Math.random() * 151 + 1).toString()
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.pokemon}/pokemon/${query.toLowerCase()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          `🐾 ${data.name?.toUpperCase() || '未知'} (#${data.id})`,
          '',
          `类型: ${data.types?.map((t: { type: { name: string } }) => t.type.name).join(', ') || '未知'}`,
          `身高: ${data.height || 0} dm`,
          `体重: ${data.weight || 0} hg`,
          '',
          `经验值: ${data.base_experience || 0}`,
          '',
          `能力值:`,
          ...(data.stats?.map((s: { stat: { name: string }; base_stat: number }) => 
            `  ${s.stat.name}: ${s.base_stat}`
          ) || []),
          '',
          '数据来源: PokeAPI',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '🐾 宝可梦查询',
          '',
          handleApiError(error, 'PokeAPI'),
          '',
          '用法: pokemon <名称或ID>',
          '示例: pokemon pikachu, pokemon 25',
        ].join('\n')
      }
    }
  },
  description: '查询宝可梦信息',
  usage: 'pokemon <名称或ID>',
  examples: ['pokemon', 'pokemon pikachu', 'pokemon 25']
})

registerCommand('numbers', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const number = args[0] || Math.floor(Math.random() * 1000).toString()
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.numbersApi}/${number}/trivia?json`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          '🔢 数字趣闻',
          '',
          `数字: ${data.number || number}`,
          '',
          data.text || '暂无信息',
          '',
          `类型: ${data.type || 'trivia'}`,
          '数据来源: Numbers API',
        ].join('\n')
      }
    } catch (error) {
      const facts = [
        '42 是宇宙的终极答案（来自《银河系漫游指南》）',
        '17 是一个素数，也是美国常见的幸运数字',
        '7 是世界上最受欢迎的幸运数字',
        '100 是三位数中最小的完全平方数',
        '256 是 2 的 8 次方，是计算机中一个重要的数字',
        '3.14159 是圆周率的近似值',
        '0 是唯一一个既不是正数也不是负数的数字',
        '1 是乘法单位元',
      ]
      
      return {
        output: [
          '🔢 数字趣闻',
          '',
          facts[Math.floor(Math.random() * facts.length)],
          '',
          handleApiError(error, 'Numbers API'),
        ].join('\n')
      }
    }
  },
  description: '获取数字趣闻',
  usage: 'numbers [数字]',
  examples: ['numbers', 'numbers 42', 'numbers 100']
})

registerCommand('crypto-history', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const coin = (args[0] || 'bitcoin').toLowerCase()
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.coinGecko.baseUrl}/coins/${coin}/market_chart?vs_currency=usd&days=7&interval=daily`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      const output = [
        `📈 ${coin.toUpperCase()} 7日价格走势`,
        '',
        `${'日期'.padEnd(12)} ${'价格 (USD)'.padEnd(18)} ${'变化'}`,
        ...((data.prices || []).map((price: [number, number], i: number, arr: [number, number][]) => {
          const date = new Date(price[0]).toLocaleDateString('zh-CN')
          const value = price[1].toLocaleString()
          const change = i > 0 
            ? ((price[1] - arr[i-1][1]) / arr[i-1][1] * 100).toFixed(2)
            : '---'
          const sign = change !== '---' && parseFloat(change) > 0 ? '+' : ''
          return `${date.padEnd(12)} $${value.padEnd(16)} ${sign}${change}%`
        }) || []),
        '',
        '数据来源: CoinGecko',
      ]
      
      return { output: output.join('\n') }
    } catch (error) {
      return {
        output: [
          '📈 加密货币历史价格',
          '',
          handleApiError(error, 'CoinGecko'),
          '',
          '用法: crypto-history <币种>',
          '示例: crypto-history bitcoin, crypto-history eth',
        ].join('\n')
      }
    }
  },
  description: '查看加密货币7日价格走势',
  usage: 'crypto-history <币种>',
  examples: ['crypto-history', 'crypto-history bitcoin']
})

registerCommand('search', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ')
    
    if (!query) {
      return {
        output: [
          '🔍 DuckDuckGo 搜索',
          '',
          '用法: search <搜索词>',
          '',
          '示例:',
          '  search WebLinuxOS',
          '  search React hooks',
          '  search 天气预报',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.duckDuckGo}/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      const results = (data.results || []).slice(0, 5)
      
      if (results.length === 0) {
        return { output: `search: 未找到 '${query}' 的结果` }
      }
      
      return {
        output: [
          `🔍 搜索结果: ${query}`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          ...results.map((result: { title: string; snippet: string; first_url: string }, index: number) => [
            `${index + 1}. ${result.title}`,
            `   ${result.snippet}`,
            `   ${result.first_url}`,
            '',
          ].join('\n')),
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '数据来源: DuckDuckGo',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '🔍 DuckDuckGo 搜索',
          '',
          handleApiError(error, '搜索'),
          '',
          '提示: 使用离线模式',
        ].join('\n')
      }
    }
  },
  description: '使用DuckDuckGo搜索',
  usage: 'search <搜索词>',
  examples: ['search WebLinuxOS', 'search React']
})

registerCommand('wiki', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ')
    
    if (!query) {
      return {
        output: [
          '📚 维基百科查询',
          '',
          '用法: wiki <关键词>',
          '',
          '示例:',
          '  wiki WebLinuxOS',
          '  wiki React',
          '  wiki 人工智能',
        ].join('\n')
      }
    }
    
    try {
      const isChinese = /[\u4e00-\u9fa5]/.test(query)
      const baseUrl = isChinese ? API_CONFIG.wikipedia.zhBaseUrl : API_CONFIG.wikipedia.baseUrl
      
      const response = await fetchWithTimeout(`${baseUrl}/search/title?q=${encodeURIComponent(query)}&limit=5`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.pages || data.pages.length === 0) {
        return { output: `wiki: 未找到 '${query}' 的结果` }
      }
      
      return {
        output: [
          `📚 维基百科搜索: ${query}`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          ...data.pages.slice(0, 5).map((page: { title: string; description?: string; thumbnail?: { source: string } }, index: number) => [
            `${index + 1}. ${page.title}`,
            page.description ? `   ${page.description}` : '',
            '',
          ].filter(Boolean)),
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '数据来源: Wikipedia API',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '📚 维基百科查询',
          '',
          handleApiError(error, '维基百科'),
          '',
          '用法: wiki <关键词>',
        ].join('\n')
      }
    }
  },
  description: '使用维基百科搜索',
  usage: 'wiki <关键词>',
  examples: ['wiki WebLinuxOS', 'wiki React', 'wiki 人工智能']
})

registerCommand('space', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.spaceflightNews.baseUrl}/articles?_limit=5`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          '🚀 航天新闻',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          ...(data || []).slice(0, 5).map((article: { title: string; summary: string; newsSite: string }, index: number) => [
            `${index + 1}. ${article.title}`,
            `   来源: ${article.newsSite}`,
            article.summary ? `   ${article.summary.slice(0, 100)}...` : '',
            '',
          ].filter(Boolean)),
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '数据来源: Spaceflight News API',
        ].join('\n')
      }
    } catch (error) {
      const fallbackNews = [
        { title: 'SpaceX 成功发射 Starship 火箭', summary: 'SpaceX 的 Starship 火箭完成了一次成功的试飞任务...', newsSite: 'SpaceX' },
        { title: 'NASA 发布新的火星探测计划', summary: 'NASA 公布了未来十年的火星探测计划...', newsSite: 'NASA' },
        { title: '中国空间站完成新的组装任务', summary: '中国空间站成功完成了新一轮的组装任务...', newsSite: '中国航天' },
        { title: '詹姆斯·韦伯望远镜发现新系外行星', summary: 'JWST 发现了一颗位于宜居带的系外行星...', newsSite: 'ESA' },
      ]
      
      return {
        output: [
          '🚀 航天新闻',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          ...fallbackNews.map((article, index) => [
            `${index + 1}. ${article.title}`,
            `   来源: ${article.newsSite}`,
            `   ${article.summary}`,
            '',
          ].join('\n')),
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          handleApiError(error, '航天新闻'),
          '提示: 使用离线备用数据',
        ].join('\n')
      }
    }
  },
  description: '获取航天相关新闻',
  usage: 'space',
  examples: ['space']
})

registerCommand('cat-fact', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.catFact.baseUrl}/fact`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          '🐱 猫咪趣闻',
          '',
          data.fact || '暂无趣闻',
          '',
          `长度: ${data.length || 0} 字符`,
          '数据来源: Cat Fact API',
        ].join('\n')
      }
    } catch (error) {
      const fallbackFacts = [
        '猫咪有32块肌肉控制耳朵，可以独立转动180度。',
        '猫咪的呼噜声频率在20-140赫兹之间，有助于骨骼和肌肉愈合。',
        '猫咪的眼睛在黑暗中可以放大4倍以捕获更多光线。',
        '猫咪每天睡眠时间约为12-16小时，是真正的睡神。',
        '猫咪的胡须是非常敏感的触觉器官，帮助它们感知周围环境。',
      ]
      
      return {
        output: [
          '🐱 猫咪趣闻',
          '',
          fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)],
          '',
          handleApiError(error, '猫咪趣闻'),
        ].join('\n')
      }
    }
  },
  description: '获取猫咪趣闻',
  usage: 'cat-fact',
  examples: ['cat-fact']
})

registerCommand('dog-image', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.dogCeo}/breeds/image/random`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          '🐕 狗狗图片',
          '',
          `图片链接: ${data.message || '暂无'}`,
          '',
          '数据来源: Dog CEO API',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '🐕 狗狗图片',
          '',
          handleApiError(error, '狗狗图片API'),
          '',
          '提示: 尝试在浏览器中打开狗狗图片应用',
        ].join('\n')
      }
    }
  },
  description: '获取随机狗狗图片',
  usage: 'dog-image',
  examples: ['dog-image']
})

registerCommand('random-user', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.randomUser}/?results=1`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const user = data.results?.[0]
      
      if (!user) {
        throw new Error('无数据')
      }
      
      return {
        output: [
          '👤 随机用户信息',
          '',
          `姓名: ${user.name?.first} ${user.name?.last}`,
          `性别: ${user.gender === 'male' ? '男' : '女'}`,
          `年龄: ${user.dob?.age} 岁`,
          `邮箱: ${user.email}`,
          `电话: ${user.phone}`,
          `国籍: ${user.location?.country}`,
          `城市: ${user.location?.city}`,
          '',
          '数据来源: Random User Generator',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '👤 随机用户信息',
          '',
          handleApiError(error, '随机用户API'),
        ].join('\n')
      }
    }
  },
  description: '生成随机用户信息',
  usage: 'random-user',
  examples: ['random-user']
})

registerCommand('help-all', {
  handler: (): CommandResult => {
    const commands = [
      { category: '文件操作', cmds: ['ls', 'cd', 'pwd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'touch'] },
      { category: '系统命令', cmds: ['whoami', 'hostname', 'date', 'uname', 'uptime', 'ps', 'top', 'kill', 'neofetch', 'sysinfo'] },
      { category: '网络与API', cmds: ['weather', 'weather-forecast', 'news', 'crypto', 'crypto-history', 'currency', 'ipinfo', 'search', 'wiki', 'space'] },
      { category: '实用工具', cmds: ['translate', 'dictionary', 'calculator', 'calendar', 'time', 'battery', 'cpu'] },
      { category: '娱乐与趣味', cmds: ['quote', 'joke', 'chuck', 'advice', 'pokemon', 'numbers', 'nasa', 'cat-fact', 'dog-image', 'random-user', 'starwars'] },
      { category: '系统管理', cmds: ['version', 'about', 'credits', 'shortcuts', 'help', 'help-all'] },
    ]
    
    const output = [
      '📚 所有可用命令',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      ...commands.map(({ category, cmds }) => [
        `${category}:`,
        `  ${cmds.join(', ')}`,
        '',
      ].join('\n')),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '使用 "help <命令>" 查看具体命令的用法',
      '示例: help weather',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示所有可用命令列表',
  usage: 'help-all',
  examples: ['help-all']
})