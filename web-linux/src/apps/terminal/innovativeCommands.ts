import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithCache } from '../../utils/apiCache'

registerCommand('news-summary', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://newsapi.org/v2/top-headlines?country=cn&apiKey=demo',
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Record<string, unknown>

      const articles = (data.articles as Array<Record<string, unknown>>) || []

      if (articles.length === 0) {
        throw new Error('No articles')
      }

      const output: string[] = []
      output.push('📰 新闻摘要')
      output.push('═'.repeat(60))
      output.push('')

      articles.slice(0, 5).forEach((article, index) => {
        const source = article.source as Record<string, unknown> || {}
        output.push(`${index + 1}. ${article.title}`)
        output.push(`   来源: ${source.name || 'N/A'}`)
        output.push(`   作者: ${article.author || 'N/A'}`)
        if (article.description) {
          output.push(`   摘要: ${(article.description as string).slice(0, 80)}...`)
        }
        if (article.url) {
          output.push(`   🔗 ${article.url}`)
        }
        output.push('')
      })

      output.push('数据来源: NewsAPI (demo)')

      return { output: output.join('\n') }
    } catch {
      const fallbackNews = [
        { title: 'WebLinuxOS 发布新版本，支持更多在线工具', source: 'WebLinuxOS News', desc: '最新版本引入了大量实用工具和API集成' },
        { title: '人工智能技术持续发展，开源项目日益增多', source: 'Tech News', desc: 'AI领域的开源项目数量呈指数级增长' },
        { title: 'WebAssembly性能提升，浏览器端运行更流畅', source: 'Web Dev', desc: '最新的WebAssembly技术让浏览器应用性能大幅提升' },
        { title: 'React 19发布，带来全新的并发特性', source: 'React Blog', desc: 'React团队发布了期待已久的新版本' },
        { title: 'TypeScript继续主导前端开发，类型安全成标配', source: 'Frontend News', desc: '越来越多的项目采用TypeScript进行开发' },
      ]

      const output: string[] = []
      output.push('📰 新闻摘要')
      output.push('═'.repeat(60))
      output.push('')

      fallbackNews.forEach((news, index) => {
        output.push(`${index + 1}. ${news.title}`)
        output.push(`   来源: ${news.source}`)
        output.push(`   摘要: ${news.desc}`)
        output.push('')
      })

      output.push('数据来源: 本地新闻库')

      return { output: output.join('\n') }
    }
  },
  description: '获取新闻摘要',
  usage: 'news-summary',
  examples: ['news-summary']
})

registerCommand('brainstorm', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const topic = args.join(' ') || '创意项目'

    const ideas = [
      `为${topic}创建一个交互式演示网站`,
      `开发${topic}的移动应用版本`,
      `构建${topic}的AI助手功能`,
      `设计${topic}的可视化仪表盘`,
      `为${topic}添加实时协作功能`,
      `开发${topic}的API接口供第三方使用`,
      `创建${topic}的浏览器扩展`,
      `构建${topic}的命令行工具`,
      `为${topic}添加数据分析功能`,
      `设计${topic}的主题定制系统`,
      `开发${topic}的离线模式`,
      `构建${topic}的插件生态系统`,
      `为${topic}添加语音交互功能`,
      `设计${topic}的多语言支持`,
      `开发${topic}的智能推荐系统`,
    ]

    const shuffled = ideas.sort(() => Math.random() - 0.5).slice(0, 8)

    const output: string[] = []
    output.push(`💡 ${topic} - 头脑风暴`)
    output.push('═'.repeat(50))
    output.push('')

    shuffled.forEach((idea, index) => {
      output.push(`${index + 1}. ${idea}`)
    })

    output.push('')
    output.push('提示: 使用 "brainstorm <主题>" 获取更多创意')

    return { output: output.join('\n') }
  },
  description: '头脑风暴工具',
  usage: 'brainstorm [主题]',
  examples: ['brainstorm', 'brainstorm 创业项目', 'brainstorm 学习计划']
})

registerCommand('calendar', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    const now = new Date()
    const year = args.length >= 2 ? parseInt(args[1]) || now.getFullYear() : now.getFullYear()
    const month = args.length >= 1 ? (parseInt(args[0]) || now.getMonth() + 1) - 1 : now.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']

    const output: string[] = []
    output.push(`📅 ${year}年 ${monthNames[month]}`)
    output.push('═'.repeat(42))
    output.push('')

    output.push('  ' + weekDays.map(d => d.padEnd(5)).join(''))
    output.push('─'.repeat(42))

    let row = ''
    for (let i = 0; i < startDay; i++) {
      row += '      '
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
      const dayStr = isToday ? `[${day.toString().padStart(2, '0')}]` : day.toString().padStart(2, ' ')
      row += dayStr.padEnd(5)

      if ((startDay + day) % 7 === 0) {
        output.push(row)
        row = ''
      }
    }

    if (row) {
      output.push(row)
    }

    output.push('')
    output.push(`今天: ${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`)
    output.push(`当月天数: ${daysInMonth}天`)
    output.push(`第一天是星期${weekDays[startDay]}`)

    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'calendar [月份] [年份]',
  examples: ['calendar', 'calendar 12 2026', 'calendar 1']
})

registerCommand('reminder', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      const reminders = [
        { time: '09:00', text: '早会' },
        { time: '10:30', text: '项目进度检查' },
        { time: '12:00', text: '午餐时间' },
        { time: '14:00', text: '代码审查' },
        { time: '16:00', text: '团队分享' },
      ]

      const output: string[] = []
      output.push('📝 今日提醒')
      output.push('═'.repeat(40))
      output.push('')

      reminders.forEach((reminder, index) => {
        output.push(`${index + 1}. ${reminder.time} - ${reminder.text}`)
      })

      output.push('')
      output.push('用法: reminder <时间> <内容>')
      output.push('示例: reminder 15:00 开会')

      return { output: output.join('\n') }
    }

    const time = args[0]
    const text = args.slice(1).join(' ')

    return {
      output: [
        '📝 提醒已设置',
        '═'.repeat(40),
        '',
        `  时间: ${time}`,
        `  内容: ${text}`,
        '',
        '提醒将在指定时间显示',
        '',
      ].join('\n')
    }
  },
  description: '设置提醒',
  usage: 'reminder [时间] [内容]',
  examples: ['reminder', 'reminder 15:00 开会', 'reminder 18:00 下班']
})

registerCommand('health', {
  handler: (): CommandResult => {
    const now = new Date()
    const hours = now.getHours()

    let advice = ''
    let emoji = ''

    if (hours >= 5 && hours < 8) {
      emoji = '🌅'
      advice = '早上好！新的一天开始了，记得吃早餐，保持好心情。'
    } else if (hours >= 8 && hours < 12) {
      emoji = '☕'
      advice = '上午好！工作效率最高的时候，集中注意力完成重要任务。'
    } else if (hours >= 12 && hours < 14) {
      emoji = '🍱'
      advice = '午餐时间！适当休息，补充能量，下午更有精力。'
    } else if (hours >= 14 && hours < 18) {
      emoji = '💪'
      advice = '下午好！继续加油，注意每隔一小时起身活动一下。'
    } else if (hours >= 18 && hours < 21) {
      emoji = '🌆'
      advice = '晚上好！放松一下，做一些喜欢的事情。'
    } else {
      emoji = '🌙'
      advice = '夜深了！该休息了，保证充足睡眠，明天更有精神。'
    }

    const output: string[] = []
    output.push(`${emoji} 健康小贴士`)
    output.push('═'.repeat(40))
    output.push('')
    output.push(`当前时间: ${now.toLocaleTimeString('zh-CN')}`)
    output.push('')
    output.push(advice)
    output.push('')
    output.push('💡 每日健康建议:')
    output.push('  • 每天至少喝8杯水')
    output.push('  • 每隔一小时活动5分钟')
    output.push('  • 保持正确的坐姿')
    output.push('  • 每天保证7-8小时睡眠')
    output.push('')

    return { output: output.join('\n') }
  },
  description: '健康小贴士',
  usage: 'health',
  examples: ['health']
})

registerCommand('productivity', {
  handler: (): CommandResult => {
    const tips = [
      '番茄工作法: 工作25分钟，休息5分钟',
      '四象限法则: 优先处理重要且紧急的任务',
      '批量处理: 把相似的任务放在一起处理',
      '时间块: 为不同类型的任务分配固定时间段',
      '避免多任务: 一次只专注于一件事',
      '设置截止时间: 给每个任务设定明确的时间限制',
      '定期回顾: 每天结束时回顾完成的工作',
      '最小化干扰: 工作时关闭通知',
      '学会说不: 不要接受超出能力范围的任务',
      '休息也很重要: 适当休息提高整体效率',
    ]

    const shuffled = tips.sort(() => Math.random() - 0.5).slice(0, 5)

    const output: string[] = []
    output.push('📊 生产力提升')
    output.push('═'.repeat(50))
    output.push('')

    shuffled.forEach((tip, index) => {
      output.push(`${index + 1}. ${tip}`)
    })

    output.push('')
    output.push('💡 提示: 定期使用 productivity 命令获取新建议')

    return { output: output.join('\n') }
  },
  description: '生产力提升建议',
  usage: 'productivity',
  examples: ['productivity']
})

registerCommand('code-review', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const language = args[0] || 'javascript'

    const reviewTips: Record<string, string[]> = {
      javascript: [
        '检查是否有未使用的变量和导入',
        '确保所有Promise都有错误处理',
        '避免使用eval()和with语句',
        '使用const/let代替var',
        '检查是否有潜在的类型转换问题',
        '确保函数有明确的返回类型',
        '避免全局变量污染',
        '检查事件监听器是否正确清理',
      ],
      typescript: [
        '检查类型定义是否准确',
        '确保没有使用any类型',
        '检查泛型是否正确使用',
        '确保接口和类型别名的正确使用',
        '检查可选链和空值合并的使用',
        '确保枚举的正确定义',
        '检查类型断言是否必要',
        '确保模块导出正确',
      ],
      python: [
        '检查PEP 8代码风格',
        '确保函数有类型注解',
        '检查是否有未使用的导入',
        '避免全局变量',
        '检查异常处理是否完整',
        '确保资源正确释放',
        '使用上下文管理器处理资源',
        '检查循环效率',
      ],
      react: [
        '检查是否有不必要的重新渲染',
        '确保hooks的正确使用顺序',
        '检查props是否有正确的默认值',
        '确保组件有合适的key',
        '检查状态管理是否合理',
        '确保事件处理函数正确绑定',
        '检查是否有内存泄漏',
        '确保错误边界的使用',
      ],
      css: [
        '检查选择器的特异性',
        '确保响应式设计',
        '检查是否有重复的样式',
        '使用CSS变量管理主题',
        '检查动画性能',
        '确保Flexbox/Grid布局正确',
        '检查z-index层级',
        '确保浏览器兼容性',
      ],
    }

    const tips = reviewTips[language.toLowerCase()] || reviewTips.javascript

    const output: string[] = []
    output.push(`🔍 ${language.toUpperCase()} 代码审查清单`)
    output.push('═'.repeat(50))
    output.push('')

    tips.forEach((tip, index) => {
      output.push(`${index + 1}. ${tip}`)
    })

    output.push('')
    output.push('用法: code-review <语言>')
    output.push('支持: javascript, typescript, python, react, css')

    return { output: output.join('\n') }
  },
  description: '代码审查清单',
  usage: 'code-review [语言]',
  examples: ['code-review', 'code-review typescript', 'code-review react']
})

registerCommand('todo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      const todos = [
        { done: true, text: '完成项目文档' },
        { done: true, text: '代码审查' },
        { done: false, text: '修复bug #123' },
        { done: false, text: '优化性能' },
        { done: false, text: '编写测试用例' },
      ]

      const output: string[] = []
      output.push('✅ 待办事项')
      output.push('═'.repeat(40))
      output.push('')

      todos.forEach((todo, index) => {
        const status = todo.done ? '[✓]' : '[ ]'
        output.push(`${index + 1}. ${status} ${todo.text}`)
      })

      const completed = todos.filter(t => t.done).length
      const total = todos.length

      output.push('')
      output.push(`进度: ${completed}/${total} (${Math.round(completed / total * 100)}%)`)
      output.push('')
      output.push('用法: todo add <内容>')
      output.push('示例: todo add 完成报告')

      return { output: output.join('\n') }
    }

    if (args[0] === 'add') {
      const text = args.slice(1).join(' ')
      return {
        output: [
          '✅ 待办事项已添加',
          '═'.repeat(40),
          '',
          `  ${text}`,
          '',
        ].join('\n')
      }
    }

    return { output: '用法: todo [add <内容>]' }
  },
  description: '待办事项管理',
  usage: 'todo [add <内容>]',
  examples: ['todo', 'todo add 完成报告']
})

registerCommand('story', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://api.quotable.io/random',
        { mode: 'cors' },
        0
      ) as Record<string, string>

      const stories = [
        `有一天，一位开发者正在调试代码，突然发现了一个难以捉摸的bug。他尝试了各种方法，但都没有成功。就在他快要放弃的时候，他想起了一句话："${data.content}" —— ${data.author}。于是他重新整理思路，最终找到了问题所在。`,
        `在一个遥远的编程世界里，有一个年轻的程序员正在学习React。他遇到了很多困难，但他没有放弃。他最喜欢的一句话是："${data.content}" —— ${data.author}。这句话一直激励着他不断前进。`,
        `团队正在面临一个紧迫的项目截止日期。每个人都感到压力很大。这时，团队负责人分享了一句名言："${data.content}" —— ${data.author}。这句话让大家重新充满了动力，最终他们按时完成了项目。`,
      ]

      const story = stories[Math.floor(Math.random() * stories.length)]

      return {
        output: [
          '📖 编程小故事',
          '═'.repeat(60),
          '',
          story,
          '',
        ].join('\n')
      }
    } catch {
      const stories = [
        '有一天，一位开发者正在调试代码，突然发现了一个难以捉摸的bug。他尝试了各种方法，但都没有成功。就在他快要放弃的时候，他想起了一句话："简单胜于复杂"。于是他重新整理思路，最终找到了问题所在。',
        '在一个遥远的编程世界里，有一个年轻的程序员正在学习React。他遇到了很多困难，但他没有放弃。他相信"坚持就是胜利"，这句话一直激励着他不断前进。',
        '团队正在面临一个紧迫的项目截止日期。每个人都感到压力很大。这时，团队负责人分享了一句名言："团结就是力量"。这句话让大家重新充满了动力，最终他们按时完成了项目。',
      ]

      const story = stories[Math.floor(Math.random() * stories.length)]

      return {
        output: [
          '📖 编程小故事',
          '═'.repeat(60),
          '',
          story,
          '',
        ].join('\n')
      }
    }
  },
  description: '编程励志小故事',
  usage: 'story',
  examples: ['story']
})

registerCommand('code-tip', {
  handler: (): CommandResult => {
    const tips = [
      { lang: 'JavaScript', tip: '使用可选链操作符(?.)可以安全地访问深层嵌套的对象属性' },
      { lang: 'TypeScript', tip: '使用类型守卫(narrowing)可以让TypeScript更好地推断类型' },
      { lang: 'React', tip: '使用React.memo来避免不必要的重新渲染' },
      { lang: 'CSS', tip: '使用CSS Grid可以轻松创建复杂的布局' },
      { lang: 'Git', tip: '使用git rebase可以保持提交历史的整洁' },
      { lang: 'Python', tip: '使用列表推导式可以写出简洁高效的代码' },
      { lang: 'Node.js', tip: '使用async/await可以避免回调地狱' },
      { lang: 'SQL', tip: '使用索引可以显著提高查询性能' },
      { lang: 'Docker', tip: '使用.dockerignore文件可以减少镜像大小' },
      { lang: 'Vim', tip: '使用gg=G可以自动格式化代码' },
    ]

    const tip = tips[Math.floor(Math.random() * tips.length)]

    return {
      output: [
        '💻 编程技巧',
        '═'.repeat(50),
        '',
        `语言: ${tip.lang}`,
        '',
        `技巧: ${tip.tip}`,
        '',
        '每天一个技巧，日积月累！',
        '',
      ].join('\n')
    }
  },
  description: '随机编程技巧',
  usage: 'code-tip',
  examples: ['code-tip']
})

registerCommand('challenge', {
  handler: (): CommandResult => {
    const challenges = [
      {
        title: 'FizzBuzz',
        desc: '打印1到100的数字，当数字是3的倍数时打印"Fizz"，是5的倍数时打印"Buzz"，既是3又是5的倍数时打印"FizzBuzz"',
        difficulty: '简单'
      },
      {
        title: '反转字符串',
        desc: '编写一个函数来反转输入的字符串，要求不使用内置的reverse方法',
        difficulty: '简单'
      },
      {
        title: '两数之和',
        desc: '给定一个整数数组和一个目标值，找出数组中两个数的索引，使它们的和等于目标值',
        difficulty: '中等'
      },
      {
        title: '回文数',
        desc: '判断一个整数是否是回文数，即正向和反向读取都相同',
        difficulty: '简单'
      },
      {
        title: '合并两个有序数组',
        desc: '将两个有序数组合并成一个新的有序数组',
        difficulty: '中等'
      },
      {
        title: '有效的括号',
        desc: '给定一个只包含括号的字符串，判断字符串是否有效',
        difficulty: '中等'
      },
      {
        title: '最长公共前缀',
        desc: '编写一个函数来查找字符串数组中的最长公共前缀',
        difficulty: '简单'
      },
      {
        title: '移除元素',
        desc: '给定一个数组和一个值，原地移除所有等于该值的元素',
        difficulty: '简单'
      },
    ]

    const challenge = challenges[Math.floor(Math.random() * challenges.length)]

    return {
      output: [
        '🏆 编程挑战',
        '═'.repeat(50),
        '',
        `题目: ${challenge.title}`,
        `难度: ${challenge.difficulty}`,
        '',
        `描述: ${challenge.desc}`,
        '',
        '试试看，你能解决这个问题吗？',
        '',
      ].join('\n')
    }
  },
  description: '编程挑战题目',
  usage: 'challenge',
  examples: ['challenge']
})

registerCommand('crypto-news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://api.coingecko.com/api/v3/news?category=general',
        { mode: 'cors' },
        5 * 60 * 1000
      ) as Array<Record<string, unknown>>

      const output: string[] = []
      output.push('💰 加密货币新闻')
      output.push('═'.repeat(60))
      output.push('')

      data.slice(0, 5).forEach((news, index) => {
        output.push(`${index + 1}. ${news.title}`)
        if (news.excerpt) {
          output.push(`   ${(news.excerpt as string).slice(0, 100)}...`)
        }
        if (news.url) {
          output.push(`   🔗 ${news.url}`)
        }
        output.push('')
      })

      output.push('数据来源: CoinGecko')

      return { output: output.join('\n') }
    } catch {
      const fallbackNews = [
        { title: '比特币突破新高度，市场情绪乐观', excerpt: '比特币价格持续上涨，投资者信心增强' },
        { title: '以太坊升级完成，网络性能提升', excerpt: '最新的以太坊升级带来了显著的性能提升' },
        { title: '机构投资者持续入场加密市场', excerpt: '越来越多的机构开始配置加密资产' },
        { title: 'DeFi生态持续发展，新协议不断涌现', excerpt: '去中心化金融生态日益繁荣' },
        { title: 'NFT市场回暖，数字艺术品受追捧', excerpt: '非同质化代币市场重新活跃' },
      ]

      const output: string[] = []
      output.push('💰 加密货币新闻')
      output.push('═'.repeat(60))
      output.push('')

      fallbackNews.forEach((news, index) => {
        output.push(`${index + 1}. ${news.title}`)
        output.push(`   ${news.excerpt}`)
        output.push('')
      })

      output.push('数据来源: 本地新闻库')

      return { output: output.join('\n') }
    }
  },
  description: '加密货币新闻',
  usage: 'crypto-news',
  examples: ['crypto-news']
})

registerCommand('world-clock', {
  handler: (): CommandResult => {
    const cities = [
      { name: '北京', offset: 8, emoji: '🇨🇳' },
      { name: '东京', offset: 9, emoji: '🇯🇵' },
      { name: '首尔', offset: 9, emoji: '🇰🇷' },
      { name: '新加坡', offset: 8, emoji: '🇸🇬' },
      { name: '迪拜', offset: 4, emoji: '🇦🇪' },
      { name: '伦敦', offset: 0, emoji: '🇬🇧' },
      { name: '巴黎', offset: 1, emoji: '🇫🇷' },
      { name: '柏林', offset: 1, emoji: '🇩🇪' },
      { name: '纽约', offset: -4, emoji: '🇺🇸' },
      { name: '洛杉矶', offset: -7, emoji: '🇺🇸' },
      { name: '芝加哥', offset: -5, emoji: '🇺🇸' },
      { name: '悉尼', offset: 10, emoji: '🇦🇺' },
      { name: '墨尔本', offset: 10, emoji: '🇦🇺' },
      { name: '奥克兰', offset: 12, emoji: '🇳🇿' },
    ]

    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000

    const output: string[] = []
    output.push('🌍 世界时钟')
    output.push('═'.repeat(50))
    output.push('')

    cities.forEach((city) => {
      const cityTime = new Date(utc + city.offset * 3600000)
      const timeStr = cityTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      output.push(`${city.emoji} ${city.name.padEnd(8)} ${timeStr}`)
    })

    output.push('')
    output.push(`本地时间: ${now.toLocaleTimeString('zh-CN')}`)

    return { output: output.join('\n') }
  },
  description: '世界时钟',
  usage: 'world-clock',
  examples: ['world-clock']
})

registerCommand('quote-of-the-day', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache(
        'https://api.quotable.io/quotes/random?limit=3',
        { mode: 'cors' },
        30 * 60 * 1000
      ) as Array<Record<string, string>>

      const output: string[] = []
      output.push('🌟 今日名言')
      output.push('═'.repeat(60))
      output.push('')

      data.forEach((quote, index) => {
        output.push(`${index + 1}. "${quote.content}"`)
        output.push(`   — ${quote.author}`)
        output.push('')
      })

      output.push('数据来源: Quotable.io')

      return { output: output.join('\n') }
    } catch {
      const quotes = [
        { content: '代码是写给人看的，只是顺便让机器执行', author: 'Robert C. Martin' },
        { content: '优秀的程序员是那些能看清事物本质的人', author: 'Grady Booch' },
        { content: '测试是证明错误存在的过程，而非证明错误不存在', author: 'Edsger W. Dijkstra' },
      ]

      const output: string[] = []
      output.push('🌟 今日名言')
      output.push('═'.repeat(60))
      output.push('')

      quotes.forEach((quote, index) => {
        output.push(`${index + 1}. "${quote.content}"`)
        output.push(`   — ${quote.author}`)
        output.push('')
      })

      return { output: output.join('\n') }
    }
  },
  description: '今日名言',
  usage: 'quote-of-the-day',
  examples: ['quote-of-the-day']
})