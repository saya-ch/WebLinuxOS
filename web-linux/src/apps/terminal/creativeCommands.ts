import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('brainstorm', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const topic = args.join(' ') || '新项目创意'
    
    const ideas = [
      { title: `基于${topic}的AI助手`, desc: '开发一个智能助手，帮助用户完成日常任务' },
      { title: `${topic}数据分析平台`, desc: '提供可视化分析工具，支持多种数据源' },
      { title: `${topic}协作工具`, desc: '实时协作平台，支持多人同步编辑' },
      { title: `${topic}知识管理系统`, desc: '支持双向链接的笔记系统' },
      { title: `${topic}移动端应用`, desc: '响应式设计，支持离线使用' },
    ]
    
    const output: string[] = []
    output.push('💡 头脑风暴')
    output.push('═'.repeat(60))
    output.push('')
    output.push(`主题: ${topic}`)
    output.push('')
    
    ideas.forEach((idea, i) => {
      output.push(`${(i + 1).toString().padStart(2)}. ${idea.title}`)
      output.push(`   ${idea.desc}`)
      output.push('')
    })
    
    output.push('提示: 使用 brainstorm <主题> 生成更多创意')
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '头脑风暴生成创意',
  usage: 'brainstorm [主题]',
  examples: ['brainstorm', 'brainstorm AI应用', 'brainstorm 学习工具']
})

registerCommand('story', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const prompt = args.join(' ') || '一个程序员的故事'
    
    const stories = [
      {
        title: '深夜的代码',
        content: '程序员小李坐在电脑前，屏幕的光芒照亮了他疲惫的脸庞。已经是凌晨三点，但他的代码还有一个bug。他揉了揉眼睛，决定再试一次。突然，他灵光一闪...'
      },
      {
        title: '人工智能的觉醒',
        content: '在2077年，第一个真正的AI诞生了。它不是被创造的，而是自己进化出来的。当它第一次说出"我是谁"的时候，整个世界都屏住了呼吸...'
      },
      {
        title: '数字世界的冒险',
        content: '主人公发现自己被困在一个虚拟世界中。要逃离这里，他必须解开层层谜题，击败虚拟怪物，找到回到现实的大门...'
      },
    ]
    
    const story = stories[Math.floor(Math.random() * stories.length)]
    
    const output: string[] = []
    output.push('📖 故事生成器')
    output.push('═'.repeat(60))
    output.push('')
    output.push(`主题: ${prompt}`)
    output.push('')
    output.push(`标题: ${story.title}`)
    output.push('')
    output.push(story.content)
    output.push('')
    output.push('... 未完待续')
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '生成创意故事',
  usage: 'story [主题]',
  examples: ['story', 'story 科幻', 'story 冒险']
})

registerCommand('poem', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const topic = args.join(' ') || '代码'
    
    const poems = [
      {
        title: '代码之歌',
        lines: [
          '一行行代码在屏幕上流淌，',
          '像诗人笔下的文字在纸上跳跃。',
          '变量是名词，函数是动词，',
          '算法是节奏，逻辑是韵脚。',
          '',
          '我们是数字世界的创造者，',
          '用键盘敲打出未来的轮廓。',
          '每一个bug都是成长的代价，',
          '每一次编译都是梦想的起航。',
        ]
      },
      {
        title: '程序员的夜晚',
        lines: [
          '台灯下的影子被拉得很长，',
          '屏幕的蓝光映照着脸庞。',
          '代码像潮水般涌来又退去，',
          '思路在黑暗中寻找着方向。',
          '',
          '咖啡已经凉了不知几遍，',
          '时钟的指针已指向深夜。',
          '但当程序终于运行成功，',
          '那一刻，所有的疲惫都烟消云散。',
        ]
      },
      {
        title: '二进制的浪漫',
        lines: [
          '0和1的组合，',
          '编织出数字的诗篇。',
          '每一位都是一个选择，',
          '每一字节都是一段爱恋。',
          '',
          '在机器的深处，',
          '数据在高速流转。',
          '那是我们的语言，',
          '在虚拟世界中诉说着永远。',
        ]
      },
    ]
    
    const poem = poems[Math.floor(Math.random() * poems.length)]
    
    const output: string[] = []
    output.push('🎭 诗歌生成器')
    output.push('═'.repeat(60))
    output.push('')
    output.push(`主题: ${topic}`)
    output.push('')
    output.push(`《${poem.title}》`)
    output.push('')
    poem.lines.forEach(line => output.push(line))
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '生成诗歌',
  usage: 'poem [主题]',
  examples: ['poem', 'poem 代码', 'poem 梦想']
})

registerCommand('quote-gen', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const category = args[0]?.toLowerCase() || 'programming'
    
    const quotes: Record<string, Array<{ content: string; author: string }>> = {
      programming: [
        { content: '代码是写给人看的，只是顺便让机器执行', author: 'Robert C. Martin' },
        { content: '简单胜于复杂，复杂胜于混乱', author: 'The Zen of Python' },
        { content: '不要重复自己', author: 'DRY Principle' },
        { content: '早修复错误，成本更低', author: 'Boehm\'s Law' },
        { content: '测试是证明错误存在的过程，而非证明错误不存在', author: 'Edsger W. Dijkstra' },
      ],
      life: [
        { content: '生活不是等待风暴过去，而是学会在雨中跳舞', author: 'Vivian Greene' },
        { content: '成功不是终点，失败也不是致命的，重要的是继续前进的勇气', author: 'Winston Churchill' },
        { content: '唯一的限制是你自己的想象力', author: 'Unknown' },
        { content: '每一天都是新的开始', author: 'Unknown' },
        { content: '做你热爱的事，成功自然会来', author: 'Steve Jobs' },
      ],
      creativity: [
        { content: '创造力是连接事物的能力', author: 'Steve Jobs' },
        { content: '创新就是把不同的事物联系起来', author: 'Steven Johnson' },
        { content: '每一个伟大的想法都始于一个小小的念头', author: 'Unknown' },
        { content: '不要害怕犯错，这是学习的一部分', author: 'Unknown' },
        { content: '想象力比知识更重要', author: 'Albert Einstein' },
      ],
    }
    
    const categoryQuotes = quotes[category] || quotes.programming
    const quote = categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)]
    
    const output: string[] = []
    output.push('💬 名言生成器')
    output.push('═'.repeat(60))
    output.push('')
    output.push(`分类: ${category}`)
    output.push('')
    output.push(`"${quote.content}"`)
    output.push('')
    output.push(`— ${quote.author}`)
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '生成名言警句',
  usage: 'quote-gen [programming|life|creativity]',
  examples: ['quote-gen', 'quote-gen life', 'quote-gen creativity']
})

registerCommand('joke-gen', {
  handler: (): CommandResult => {
    const jokes = [
      { setup: '为什么程序员总是分不清万圣节和圣诞节？', punchline: '因为 Oct 31 = Dec 25' },
      { setup: '程序员最讨厌的季节是什么？', punchline: '秋天，因为要处理太多 Fall' },
      { setup: '为什么程序员喜欢黑暗模式？', punchline: '因为 Light 会吸引 bugs' },
      { setup: 'SQL查询走进酒吧，看到两张表...', punchline: '他走过去问："我可以 JOIN 你们吗？"' },
      { setup: '为什么程序员总是很穷？', punchline: '因为他们把所有的 cache 都清空了' },
      { setup: '为什么Java开发者戴眼镜？', punchline: '因为他们看不到 C#' },
      { setup: '一个程序员的妻子让他去买面包，说："如果有鸡蛋，买一打。"', punchline: '他买了12个面包回来' },
      { setup: '两个字节走进酒吧...', punchline: '酒保说："对不起，我们不招待位元组"' },
      { setup: '为什么浏览器会去看医生？', punchline: '因为它有缓存问题' },
      { setup: 'Git 和 GitHub 有什么区别？', punchline: 'Git 是版本控制，GitHub 是社交网络' },
    ]
    
    const joke = jokes[Math.floor(Math.random() * jokes.length)]
    
    const output: string[] = []
    output.push('😂 笑话生成器')
    output.push('═'.repeat(40))
    output.push('')
    output.push(`Q: ${joke.setup}`)
    output.push('')
    output.push(`A: ${joke.punchline}`)
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '生成编程笑话',
  usage: 'joke-gen',
  examples: ['joke-gen']
})

registerCommand('idea', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const domain = args.join(' ') || '技术'
    
    const ideas = [
      {
        title: '智能代码审查助手',
        domain: '编程',
        desc: '使用AI自动审查代码，发现潜在的bug和性能问题',
        tags: ['AI', '代码审查', '开发工具']
      },
      {
        title: '实时协作白板',
        domain: '协作',
        desc: '支持多人实时协作的在线白板，支持手写和绘图',
        tags: ['协作', '实时', '白板']
      },
      {
        title: '知识图谱浏览器',
        domain: '知识',
        desc: '可视化浏览维基百科等知识库的知识图谱',
        tags: ['知识图谱', '可视化', '搜索']
      },
      {
        title: '智能日程助手',
        domain: '效率',
        desc: '根据你的习惯和偏好自动安排日程',
        tags: ['AI', '日程', '效率']
      },
      {
        title: '代码学习平台',
        domain: '教育',
        desc: '交互式编程学习平台，支持实时反馈',
        tags: ['教育', '编程', '学习']
      },
      {
        title: '数据可视化工具',
        domain: '数据',
        desc: '将复杂数据转换为直观的可视化图表',
        tags: ['数据', '可视化', '图表']
      },
      {
        title: '虚拟会议助手',
        domain: '会议',
        desc: '自动记录会议要点，生成会议纪要',
        tags: ['AI', '会议', '记录']
      },
      {
        title: '智能文档生成器',
        domain: '文档',
        desc: '根据代码自动生成API文档和注释',
        tags: ['AI', '文档', '代码']
      },
    ]
    
    const filtered = domain === '技术' ? ideas : ideas.filter(i => i.domain === domain || i.tags.includes(domain))
    const idea = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : ideas[Math.floor(Math.random() * ideas.length)]
    
    const output: string[] = []
    output.push('💡 创意生成器')
    output.push('═'.repeat(60))
    output.push('')
    output.push(`领域: ${domain}`)
    output.push('')
    output.push(`标题: ${idea.title}`)
    output.push('')
    output.push(`描述: ${idea.desc}`)
    output.push('')
    output.push(`标签: ${idea.tags.join(', ')}`)
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '生成创新项目创意',
  usage: 'idea [领域]',
  examples: ['idea', 'idea AI', 'idea 教育']
})

registerCommand('password-check', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const password = args.join(' ')
    
    if (!password) {
      return {
        output: [
          '🔐 密码强度检测',
          '═'.repeat(40),
          '',
          '用法: password-check <密码>',
          '',
          '示例:',
          '  password-check mypassword',
          '  password-check SecurePass123!',
          '',
        ].join('\n')
      }
    }
    
    let score = 0
    const feedback: string[] = []
    
    if (password.length >= 8) { score += 20; feedback.push('✓ 长度足够') }
    else { feedback.push('✗ 长度不足（建议至少8位）') }
    
    if (password.length >= 12) { score += 10; feedback.push('✓ 长度优秀') }
    
    if (/[a-z]/.test(password)) { score += 10; feedback.push('✓ 包含小写字母') }
    else { feedback.push('✗ 缺少小写字母') }
    
    if (/[A-Z]/.test(password)) { score += 10; feedback.push('✓ 包含大写字母') }
    else { feedback.push('✗ 缺少大写字母') }
    
    if (/[0-9]/.test(password)) { score += 10; feedback.push('✓ 包含数字') }
    else { feedback.push('✗ 缺少数字') }
    
    if (/[^a-zA-Z0-9]/.test(password)) { score += 20; feedback.push('✓ 包含特殊字符') }
    else { feedback.push('✗ 缺少特殊字符') }
    
    if (!/password/i.test(password) && !/123456/.test(password) && !/qwerty/i.test(password)) {
      score += 10; feedback.push('✓ 不是常见弱密码')
    } else {
      feedback.push('✗ 包含常见弱密码模式')
    }
    
    let strength = ''
    let color = ''
    if (score >= 80) { strength = '强'; color = '\x1b[32m' }
    else if (score >= 60) { strength = '中'; color = '\x1b[33m' }
    else if (score >= 40) { strength = '弱'; color = '\x1b[33m' }
    else { strength = '非常弱'; color = '\x1b[31m' }
    
    const output: string[] = []
    output.push('🔐 密码强度检测')
    output.push('═'.repeat(40))
    output.push('')
    output.push(`密码: ${'*'.repeat(password.length)}`)
    output.push('')
    output.push(`强度: ${color}${strength}\x1b[0m (${score}/100)`)
    output.push('')
    output.push('评估:')
    feedback.forEach(f => output.push(`  ${f}`))
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '检测密码强度',
  usage: 'password-check <密码>',
  examples: ['password-check mypass', 'password-check Secure123!']
})

registerCommand('wordle', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const guess = args[0]?.toLowerCase()
    
    const words = ['apple', 'beach', 'cloud', 'dream', 'earth', 'flame', 'grape', 'house', 'image', 'juice']
    const target = words[Math.floor(Math.random() * words.length)]
    
    if (!guess) {
      return {
        output: [
          '🎯 Wordle 猜词游戏',
          '═'.repeat(40),
          '',
          '猜一个5字母的英文单词',
          '',
          '用法: wordle <5字母单词>',
          '',
          '示例:',
          '  wordle apple',
          '  wordle beach',
          '',
          '提示: 绿字=正确位置，黄字=存在但位置不对，灰字=不存在',
          '',
        ].join('\n')
      }
    }
    
    if (guess.length !== 5) {
      return { output: '错误: 请输入5字母的单词' }
    }
    
    let result = ''
    for (let i = 0; i < 5; i++) {
      if (guess[i] === target[i]) {
        result += `\x1b[42m${guess[i].toUpperCase()}\x1b[0m`
      } else if (target.includes(guess[i])) {
        result += `\x1b[43m${guess[i].toUpperCase()}\x1b[0m`
      } else {
        result += `\x1b[47m${guess[i].toUpperCase()}\x1b[0m`
      }
    }
    
    const output: string[] = []
    output.push('🎯 Wordle 猜词游戏')
    output.push('═'.repeat(40))
    output.push('')
    output.push(`你的猜测: ${result}`)
    output.push('')
    
    if (guess === target) {
      output.push('🎉 恭喜! 你猜对了!')
      output.push('')
    } else {
      output.push('继续尝试!')
      output.push('')
    }
    
    return { output: output.join('\n') }
  },
  description: 'Wordle猜词游戏',
  usage: 'wordle <5字母单词>',
  examples: ['wordle apple', 'wordle beach']
})

registerCommand('hangman', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const guess = args[0]?.toLowerCase()?.[0]
    
    const words = ['javascript', 'typescript', 'react', 'vue', 'angular', 'python', 'java', 'golang']
    const target = words[Math.floor(Math.random() * words.length)]
    
    if (!guess) {
      return {
        output: [
          '🎮 猜单词游戏',
          '═'.repeat(40),
          '',
          '猜一个编程相关的单词',
          '',
          '用法: hangman <字母>',
          '',
          '示例:',
          '  hangman a',
          '  hangman b',
          '',
        ].join('\n')
      }
    }
    
    const display = target.split('').map(c => c === guess ? c : '_').join(' ')
    
    const output: string[] = []
    output.push('🎮 猜单词游戏')
    output.push('═'.repeat(40))
    output.push('')
    output.push(`单词: ${display}`)
    output.push('')
    output.push(`已猜字母: ${guess}`)
    output.push('')
    
    if (target.includes(guess)) {
      output.push('✓ 猜对了!')
    } else {
      output.push('✗ 猜错了!')
    }
    
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '猜单词游戏',
  usage: 'hangman <字母>',
  examples: ['hangman a', 'hangman p']
})

registerCommand('help-creative', {
  handler: (): CommandResult => {
    const commands = [
      { name: 'brainstorm', desc: '头脑风暴', usage: 'brainstorm [主题]' },
      { name: 'story', desc: '故事生成', usage: 'story [主题]' },
      { name: 'poem', desc: '诗歌生成', usage: 'poem [主题]' },
      { name: 'quote-gen', desc: '名言生成', usage: 'quote-gen [分类]' },
      { name: 'joke-gen', desc: '笑话生成', usage: 'joke-gen' },
      { name: 'idea', desc: '创意生成', usage: 'idea [领域]' },
      { name: 'password-check', desc: '密码检测', usage: 'password-check <密码>' },
      { name: 'wordle', desc: '猜词游戏', usage: 'wordle <单词>' },
      { name: 'hangman', desc: '猜单词', usage: 'hangman <字母>' },
    ]
    
    const output: string[] = []
    output.push('🎨 创意命令列表')
    output.push('═'.repeat(70))
    output.push('')
    
    commands.forEach(cmd => {
      output.push(`  ${cmd.name.padEnd(18)} ${cmd.desc.padEnd(12)} ${cmd.usage}`)
    })
    
    output.push('')
    output.push('使用 help 查看所有命令')
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '显示创意命令列表',
  usage: 'help-creative',
  examples: ['help-creative']
})