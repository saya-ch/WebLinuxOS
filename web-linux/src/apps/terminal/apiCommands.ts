import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'

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

registerCommand('pokemon', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ')
    
    if (!query) {
      return {
        output: [
          '🐾 Pokemon 查询',
          '',
          '用法: pokemon <名称或ID>',
          '',
          '示例:',
          '  pokemon pikachu',
          '  pokemon 25',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`)
      
      if (!response.ok) {
        return { output: `Pokemon 查询失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      const output = [
        `🐾 ${data.name.charAt(0).toUpperCase() + data.name.slice(1)}`,
        '',
        `ID: #${data.id}`,
        `身高: ${data.height / 10} m`,
        `体重: ${data.weight / 10} kg`,
        '',
        `类型: ${data.types.map((t: any) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)).join(', ')}`,
        '',
        `基础经验值: ${data.base_experience}`,
        `能力值:`,
        ...data.stats.map((stat: any) => `  ${stat.stat.name}: ${stat.base_stat}`),
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, 'Pokemon查询') }
    }
  },
  description: '查询 Pokemon 信息（使用 PokeAPI）',
  usage: 'pokemon <名称或ID>',
  examples: ['pokemon pikachu', 'pokemon 25']
})

registerCommand('astronauts', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout('http://api.open-notify.org/astros.json')
      
      if (!response.ok) {
        return { output: `宇航员信息获取失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      const output = [
        '🚀 当前在太空的宇航员',
        '',
        `总人数: ${data.number}`,
        '',
        ...data.people.map((person: any, index: number) => [
          `${index + 1}. ${person.name}`,
          `   飞船: ${person.craft}`,
        ].join('\n')),
        '',
        '数据来源: Open Notify API',
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, '宇航员信息') }
    }
  },
  description: '查看当前在太空的宇航员',
  usage: 'astronauts',
  examples: ['astronauts']
})

registerCommand('iss', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout('http://api.open-notify.org/iss-now.json')
      
      if (!response.ok) {
        return { output: `ISS位置获取失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      const output = [
        '🛰️ 国际空间站位置',
        '',
        `纬度: ${data.iss_position.latitude}`,
        `经度: ${data.iss_position.longitude}`,
        `时间: ${new Date(data.timestamp * 1000).toLocaleString('zh-CN')}`,
        '',
        '数据来源: Open Notify API',
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, 'ISS位置') }
    }
  },
  description: '获取国际空间站当前位置',
  usage: 'iss',
  examples: ['iss']
})

registerCommand('spacex', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout('https://api.spacexdata.com/v4/launches/latest')
      
      if (!response.ok) {
        return { output: `SpaceX数据获取失败: ${response.status} ${response.statusText}` }
      }
      
      const data = await response.json()
      
      const output = [
        '🚀 SpaceX 最新发射',
        '',
        `任务名称: ${data.name}`,
        `日期: ${new Date(data.date_local).toLocaleString('zh-CN')}`,
        `状态: ${data.success ? '✅ 成功' : '❌ 失败'}`,
        `火箭: ${data.rocket}`,
        `发射台: ${data.launchpad}`,
        '',
        `详情: ${data.details || '暂无'}`,
        '',
        '数据来源: SpaceX API',
      ].join('\n')
      
      return { output }
    } catch (error) {
      return { output: handleApiError(error, 'SpaceX数据') }
    }
  },
  description: '获取 SpaceX 最新发射信息',
  usage: 'spacex',
  examples: ['spacex']
})