import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'

registerCommand('nasa', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.nasa.baseUrl}/apod?api_key=${API_CONFIG.nasa.key}&count=1`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const apod = Array.isArray(data) ? data[0] : data
      
      return {
        output: [
          '🚀 NASA 每日天文图片',
          '',
          `标题: ${apod.title || '未知'}`,
          '',
          `日期: ${apod.date || '未知'}`,
          '',
          `${apod.explanation || '暂无描述'}`,
          '',
          `图片链接: ${apod.url || apod.hdurl || '暂无'}`,
          '',
          '提示: 将链接复制到浏览器中打开查看图片',
          '',
          '数据来源: NASA APOD API',
        ].join('\n')
      }
    } catch (error) {
      const fallbackApod = [
        {
          title: '哈勃深空场',
          explanation: '哈勃太空望远镜拍摄的深空场照片，展示了数千个遥远的星系，其中一些星系的光线已经旅行了超过100亿年才到达地球。',
        },
        {
          title: '火星表面',
          explanation: '好奇号火星车拍摄的火星表面照片，展示了红色星球的壮丽景观和地质特征。',
        },
        {
          title: '木星大红斑',
          explanation: '木星上的巨大风暴系统，已经持续了至少300年，直径足以容纳整个地球。',
        },
      ]
      
      const apod = fallbackApod[Math.floor(Math.random() * fallbackApod.length)]
      
      return {
        output: [
          '🚀 NASA 每日天文图片',
          '',
          `标题: ${apod.title}`,
          '',
          `${apod.explanation}`,
          '',
          handleApiError(error, 'NASA API'),
          '提示: 使用备用数据',
        ].join('\n')
      }
    }
  },
  description: '获取NASA每日天文图片',
  usage: 'nasa',
  examples: ['nasa']
})

registerCommand('wikipedia', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ')
    
    if (!query) {
      return {
        output: [
          '📚 Wikipedia 百科查询',
          '',
          '用法: wikipedia <查询词>',
          '示例: wikipedia Linux, wikipedia React, wikipedia JavaScript',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.wikipedia.zhBaseUrl}/page/summary/${encodeURIComponent(query)}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.type === 'disambiguation') {
        return {
          output: [
            '📚 Wikipedia 百科查询',
            '',
            `条目 "${query}" 存在歧义，请提供更具体的查询词。`,
            '',
            '可能的选项:',
            ...(data.items?.map((item: { title: string }) => `  - ${item.title}`) || []),
          ].join('\n')
        }
      }
      
      return {
        output: [
          `📚 ${data.title || '未知'}`,
          '',
          `${data.description || ''}`,
          '',
          data.extract || '暂无摘要',
          '',
          `链接: ${data.content_urls?.desktop?.page || ''}`,
          '',
          '数据来源: Wikipedia API',
        ].join('\n')
      }
    } catch (error) {
      const fallbackWiki: Record<string, { summary: string; description: string }> = {
        'linux': {
          description: 'Linux 是一种自由和开放源码的类 Unix 操作系统内核。',
          summary: 'Linux 内核最初由芬兰程序员 Linus Torvalds 在1991年开发。如今，Linux 是世界上最流行的操作系统内核之一，运行在服务器、超级计算机、嵌入式设备以及越来越多的个人电脑上。',
        },
        'react': {
          description: 'React 是用于构建用户界面的 JavaScript 库。',
          summary: 'React 由 Facebook 开发并维护，于2013年首次发布。它采用组件化和虚拟DOM的概念，使得构建复杂的用户界面变得更加简单和高效。',
        },
        'javascript': {
          description: 'JavaScript 是一种具有函数优先的轻量级解释型或即时编译型的编程语言。',
          summary: 'JavaScript 最初由 Brendan Eich 在 Netscape 公司于1995年创建，仅用了10天时间。如今它已成为 Web 开发的核心技术之一，运行在所有主流浏览器中。',
        },
        'typescript': {
          description: 'TypeScript 是 JavaScript 的一个超集，添加了可选的静态类型检查和基于类的面向对象编程。',
          summary: 'TypeScript 由 Microsoft 开发，于2012年发布。它可以编译成纯 JavaScript，运行在任何浏览器、Node.js 或其他 JavaScript 引擎中。',
        },
        'weblinuxos': {
          description: 'WebLinuxOS 是一个完全在浏览器中运行的 Linux 桌面环境。',
          summary: 'WebLinuxOS 提供虚拟文件系统、终端模拟器、窗口管理器和200+个应用程序，所有功能都在浏览器中本地运行，无需安装或后端支持。',
        },
      }
      
      const wiki = fallbackWiki[query.toLowerCase()] || {
        description: '',
        summary: `未找到关于 "${query}" 的信息，请尝试其他查询词。`,
      }
      
      return {
        output: [
          `📚 ${query}`,
          '',
          `${wiki.description}`,
          '',
          wiki.summary,
          '',
          handleApiError(error, 'Wikipedia'),
          '提示: 使用本地知识库',
        ].join('\n')
      }
    }
  },
  description: '查询Wikipedia百科',
  usage: 'wikipedia <查询词>',
  examples: ['wikipedia Linux', 'wikipedia React']
})

registerCommand('github-trending', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const language = args[0]?.toLowerCase() || ''
    
    try {
      const url = language
        ? `${API_CONFIG.githubApi.baseUrl}/search/repositories?q=language:${language}&sort=stars&order=desc&per_page=10`
        : `${API_CONFIG.githubApi.baseUrl}/search/repositories?q=created:>2024-01-01&sort=stars&order=desc&per_page=10`
      
      const response = await fetchWithTimeout(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.items || data.items.length === 0) {
        return {
          output: [
            '📈 GitHub 趋势',
            '',
            '暂无数据',
          ].join('\n')
        }
      }
      
      const output = [
        language ? `📈 GitHub 趋势 - ${language}` : '📈 GitHub 趋势',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        ...data.items.map((repo: { name: string; full_name: string; description: string; stargazers_count: number; language: string; html_url: string }, index: number) =>
          `${(index + 1).toString().padStart(2)}. ${repo.full_name}\n     ⭐ ${repo.stargazers_count.toLocaleString()} | ${repo.language || '未知'}\n     ${repo.description || '暂无描述'}\n`
        ),
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '数据来源: GitHub API',
        '',
        '用法: github-trending [语言]',
        '示例: github-trending, github-trending typescript',
      ]
      
      return { output: output.join('\n') }
    } catch (error) {
      const fallbackRepos = [
        { name: 'saya-ch/WebLinuxOS', stars: 1200, language: 'TypeScript', description: '基于Web的Linux桌面环境' },
        { name: 'vercel/next.js', stars: 120000, language: 'TypeScript', description: 'React框架' },
        { name: 'facebook/react', stars: 220000, language: 'JavaScript', description: '用于构建用户界面的JavaScript库' },
        { name: 'tailwindlabs/tailwindcss', stars: 86000, language: 'TypeScript', description: '实用优先的CSS框架' },
        { name: 'vuejs/core', stars: 200000, language: 'TypeScript', description: 'Vue.js核心库' },
      ]
      
      return {
        output: [
          '📈 GitHub 趋势',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          ...fallbackRepos.map((repo, index) =>
            `${(index + 1).toString().padStart(2)}. ${repo.name}\n     ⭐ ${repo.stars.toLocaleString()} | ${repo.language}\n     ${repo.description}\n`
          ),
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          handleApiError(error, 'GitHub API'),
          '提示: 使用备用数据',
        ].join('\n')
      }
    }
  },
  description: '查看GitHub趋势仓库',
  usage: 'github-trending [语言]',
  examples: ['github-trending', 'github-trending typescript']
})

registerCommand('dict', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const word = args.join(' ')
    
    if (!word) {
      return {
        output: [
          '📖 词典查询',
          '',
          '用法: dict <单词>',
          '示例: dict hello, dict computer, dict programming',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.dictionaryApi.baseUrl}/entries/en/${encodeURIComponent(word)}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data || data.length === 0) {
        return { output: `dict: 未找到单词 '${word}'` }
      }
      
      const entry = data[0]
      const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || ''
      
      const output = [
        `📖 ${entry.word}${phonetic ? ` [${phonetic}]` : ''}`,
        '',
      ]
      
      entry.meanings?.forEach((meaning: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }) => {
        output.push(`【${meaning.partOfSpeech}】`)
        meaning.definitions?.forEach((def, idx) => {
          output.push(`${idx + 1}. ${def.definition}`)
          if (def.example) {
            output.push(`   例句: ${def.example}`)
          }
        })
        output.push('')
      })
      
      output.push('数据来源: Free Dictionary API')
      
      return { output: output.join('\n') }
    } catch (error) {
      const fallbackDict: Record<string, { phonetic: string; definitions: { pos: string; def: string; example?: string }[] }> = {
        'hello': {
          phonetic: '/həˈloʊ/',
          definitions: [
            { pos: '感叹词', def: '用于打招呼或引起注意', example: 'Hello, how are you?' },
            { pos: '名词', def: '问候语', example: 'Give your mother a hello from me.' },
          ],
        },
        'computer': {
          phonetic: '/kəmˈpjuːtər/',
          definitions: [
            { pos: '名词', def: '能够接收、处理和存储数据的电子设备', example: 'I use my computer every day.' },
          ],
        },
        'programming': {
          phonetic: '/ˈproʊɡræmɪŋ/',
          definitions: [
            { pos: '名词', def: '编写计算机程序的过程', example: 'Programming is my favorite hobby.' },
            { pos: '动词', def: '为计算机编写程序', example: 'He is programming a new application.' },
          ],
        },
        'code': {
          phonetic: '/koʊd/',
          definitions: [
            { pos: '名词', def: '计算机程序的指令集合', example: 'The code is written in Python.' },
            { pos: '动词', def: '编写代码', example: 'She codes for eight hours a day.' },
          ],
        },
      }
      
      const dict = fallbackDict[word.toLowerCase()] || {
        phonetic: '',
        definitions: [{ pos: '', def: `未找到单词 "${word}" 的定义` }],
      }
      
      const output = [
        `📖 ${word}${dict.phonetic ? ` [${dict.phonetic}]` : ''}`,
        '',
      ]
      
      dict.definitions.forEach((item) => {
        if (item.pos) output.push(`【${item.pos}】`)
        output.push(`• ${item.def}`)
        if (item.example) output.push(`  例句: ${item.example}`)
      })
      
      output.push('')
      output.push(handleApiError(error, '词典API'))
      output.push('提示: 使用本地词典')
      
      return { output: output.join('\n') }
    }
  },
  description: '查询英文单词释义',
  usage: 'dict <单词>',
  examples: ['dict hello', 'dict computer']
})

registerCommand('ip', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const targetIp = args[0]
    
    if (!targetIp) {
      try {
        const response = await fetchWithTimeout('https://api.ipify.org?format=json')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        
        return {
          output: [
            '🌐 公网IP查询',
            '',
            `您的公网IP: ${data.ip || '未知'}`,
            '',
            '数据来源: ipify.org',
            '',
            '用法: ip <目标IP> 查询IP详细信息',
            '示例: ip 8.8.8.8',
          ].join('\n')
        }
      } catch (error) {
        return {
          output: [
            '🌐 公网IP查询',
            '',
            handleApiError(error, 'IP查询'),
            '',
            '用法: ip <目标IP> 查询IP详细信息',
            '示例: ip 8.8.8.8',
          ].join('\n')
        }
      }
    }
    
    try {
      const response = await fetchWithTimeout(`https://ipapi.co/${targetIp}/json/`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          `🌐 IP信息: ${targetIp}`,
          '',
          `国家: ${data.country_name || '未知'} (${data.country_code || ''})`,
          `地区: ${data.region || '未知'}`,
          `城市: ${data.city || '未知'}`,
          `邮政编码: ${data.postal || '未知'}`,
          `经纬度: ${data.latitude || ''}, ${data.longitude || ''}`,
          `时区: ${data.timezone || '未知'}`,
          `ISP: ${data.org || '未知'}`,
          `ASN: ${data.asn || '未知'}`,
          '',
          '数据来源: ipapi.co',
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          `🌐 IP信息: ${targetIp}`,
          '',
          handleApiError(error, 'IP查询'),
        ].join('\n')
      }
    }
  },
  description: '查询公网IP或IP详细信息',
  usage: 'ip [目标IP]',
  examples: ['ip', 'ip 8.8.8.8']
})

registerCommand('weather-forecast', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    const cityMap: Record<string, { lat: number; lon: number; name: string }> = {
      'beijing': { lat: 39.9042, lon: 116.4074, name: '北京' },
      'shanghai': { lat: 31.2304, lon: 121.4737, name: '上海' },
      'guangzhou': { lat: 23.1291, lon: 113.2644, name: '广州' },
      'shenzhen': { lat: 22.5431, lon: 114.0579, name: '深圳' },
      'tokyo': { lat: 35.6762, lon: 139.6503, name: '东京' },
      'newyork': { lat: 40.7128, lon: -74.0060, name: '纽约' },
      'london': { lat: 51.5074, lon: -0.1278, name: '伦敦' },
      'paris': { lat: 48.8566, lon: 2.3522, name: '巴黎' },
    }
    
    const cityInfo = cityMap[city.toLowerCase()] || { lat: 39.9042, lon: 116.4074, name: city }
    
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia/Shanghai&forecast_days=7`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      const weatherCodes: Record<number, string> = {
        0: '☀️ 晴', 1: '☀️ 晴', 2: '⛅ 多云', 3: '☁️ 阴',
        45: '🌫️ 雾', 48: '🌫️ 雾凇',
        51: '🌧️ 小雨', 53: '🌧️ 中雨', 55: '🌧️ 大雨',
        61: '🌧️ 小雨', 63: '🌧️ 中雨', 65: '🌧️ 大雨',
        71: '❄️ 小雪', 73: '❄️ 中雪', 75: '❄️ 大雪',
        80: '🌦️ 阵雨', 81: '⛈️ 强阵雨', 82: '⛈️ 暴雨',
        95: '⚡ 雷暴', 96: '⚡ 雷暴伴冰雹', 99: '⚡ 雷暴伴大雨',
      }
      
      const days = ['今天', '明天', '后天', '第四天', '第五天', '第六天', '第七天']
      
      const output = [
        `🌤️ ${cityInfo.name} 7日天气预报`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        ...data.daily.time.map((_date: string, i: number) => {
          const code = data.daily.weather_code?.[i] || 0
          const desc = weatherCodes[code] || '未知'
          const max = data.daily.temperature_2m_max?.[i] || 0
          const min = data.daily.temperature_2m_min?.[i] || 0
          return `${days[i].padEnd(6)} ${desc.padEnd(8)} ${min}°C ~ ${max}°C`
        }),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '数据来源: Open-Meteo',
      ]
      
      return { output: output.join('\n') }
    } catch (error) {
      const fallbackForecast = [
        { day: '今天', desc: '☀️ 晴', min: 22, max: 30 },
        { day: '明天', desc: '⛅ 多云', min: 21, max: 28 },
        { day: '后天', desc: '🌧️ 小雨', min: 19, max: 25 },
        { day: '第四天', desc: '☁️ 阴', min: 20, max: 26 },
        { day: '第五天', desc: '☀️ 晴', min: 21, max: 29 },
        { day: '第六天', desc: '⛅ 多云', min: 22, max: 31 },
        { day: '第七天', desc: '☀️ 晴', min: 23, max: 32 },
      ]
      
      return {
        output: [
          `🌤️ ${cityInfo.name} 7日天气预报`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          ...fallbackForecast.map(f => `${f.day.padEnd(6)} ${f.desc.padEnd(8)} ${f.min}°C ~ ${f.max}°C`),
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          handleApiError(error, '天气预报'),
          '提示: 使用备用数据',
        ].join('\n')
      }
    }
  },
  description: '查询7日天气预报',
  usage: 'weather-forecast [城市]',
  examples: ['weather-forecast', 'weather-forecast Shanghai']
})

registerCommand('randomuser', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.randomUser.baseUrl}?inc=name,email,location,picture`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const user = data.results?.[0]
      
      if (!user) {
        throw new Error('无用户数据')
      }
      
      return {
        output: [
          '👤 随机用户',
          '',
          `姓名: ${user.name?.title}. ${user.name?.first} ${user.name?.last}`,
          `邮箱: ${user.email || '未知'}`,
          `城市: ${user.location?.city || '未知'}, ${user.location?.country || '未知'}`,
          `头像: ${user.picture?.large || ''}`,
          '',
          '数据来源: RandomUser API',
          '',
          '提示: 将头像链接复制到浏览器中打开查看',
        ].join('\n')
      }
    } catch (error) {
      const fallbackUsers = [
        { name: '张三', email: 'zhangsan@example.com', city: '北京', country: '中国' },
        { name: 'John Smith', email: 'john@example.com', city: 'New York', country: 'USA' },
        { name: '田中太郎', email: 'tanaka@example.com', city: '东京', country: '日本' },
      ]
      
      const user = fallbackUsers[Math.floor(Math.random() * fallbackUsers.length)]
      
      return {
        output: [
          '👤 随机用户',
          '',
          `姓名: ${user.name}`,
          `邮箱: ${user.email}`,
          `城市: ${user.city}, ${user.country}`,
          '',
          handleApiError(error, 'RandomUser'),
          '提示: 使用备用数据',
        ].join('\n')
      }
    }
  },
  description: '生成随机用户信息',
  usage: 'randomuser',
  examples: ['randomuser']
})

registerCommand('fact', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.catFact.baseUrl}/fact`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        output: [
          '🐱 猫咪冷知识',
          '',
          `"${data.fact || '暂无'}"`,
          '',
          `长度: ${data.length || 0} 字`,
          '',
          '数据来源: catfact.ninja',
        ].join('\n')
      }
    } catch (error) {
      const fallbackFacts = [
        '猫的睡眠时间大约是人类的两倍，它们每天睡12-16小时。',
        '猫的听觉比狗更灵敏，可以听到高达64kHz的声音。',
        '猫的眼睛有一层反光膜，帮助它们在黑暗中看到东西。',
        '猫有32块肌肉控制耳朵，可以独立转动。',
        '猫的鼻子上有独特的纹路，就像人类的指纹一样。',
      ]
      
      return {
        output: [
          '🐱 猫咪冷知识',
          '',
          `"${fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)]}"`,
          '',
          handleApiError(error, 'CatFact'),
          '提示: 使用备用数据',
        ].join('\n')
      }
    }
  },
  description: '获取猫咪冷知识',
  usage: 'fact',
  examples: ['fact']
})

registerCommand('emoji', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const query = args.join(' ').toLowerCase()
    
    const emojiList: Record<string, string[]> = {
      'happy': ['😄', '😀', '😊', '🙂', '😃', '😁', '😆', '🥰'],
      'sad': ['😢', '😭', '😔', '😞', '😟', '😥', '😰', '😿'],
      'love': ['❤️', '💖', '💗', '💘', '💝', '💓', '💕', '💞'],
      'angry': ['😠', '😡', '🤬', '😤', '😾'],
      'weather': ['☀️', '🌤️', '⛅', '☁️', '🌧️', '⛈️', '❄️', '🌫️'],
      'food': ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🥝'],
      'animal': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
      'tech': ['💻', '📱', '💾', '🖥️', '⌨️', '🖱️', '📡', '🔌'],
      'code': ['📝', '💡', '🔧', '🛠️', '🔍', '📊', '📈', '🎯'],
      'space': ['🚀', '🌙', '⭐', '🌟', '✨', '🌌', '🪐', '🌠'],
    }
    
    const categories = Object.keys(emojiList)
    
    if (!query) {
      const output = [
        '🎉 Emoji 查询',
        '',
        '可用类别:',
        ...categories.map(c => `  • ${c}`),
        '',
        '用法: emoji <类别>',
        '示例: emoji happy, emoji tech',
      ]
      return { output: output.join('\n') }
    }
    
    const results = emojiList[query] || []
    
    if (results.length === 0) {
      return {
        output: [
          '🎉 Emoji 查询',
          '',
          `未找到类别 '${query}'`,
          '',
          '可用类别:',
          ...categories.map(c => `  • ${c}`),
        ].join('\n')
      }
    }
    
    return {
      output: [
        `🎉 ${query} 相关 Emoji`,
        '',
        results.join(' '),
        '',
        `共 ${results.length} 个 Emoji`,
      ].join('\n')
    }
  },
  description: '查询Emoji',
  usage: 'emoji <类别>',
  examples: ['emoji happy', 'emoji tech']
})