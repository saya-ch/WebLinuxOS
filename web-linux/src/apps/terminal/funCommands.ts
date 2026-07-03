import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { listCommands, getCommand } from './commands'

registerCommand('cowsay', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const output = [
      ' _______________________',
      `< ${args.join(' ') || 'Hello World!'} >`,
      ' -----------------------',
      '        \\   ^__^',
      '         \\  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ].join('\n')
    
    return { output }
  },
  description: '让牛说话',
  usage: 'cowsay <消息>',
  examples: ['cowsay Hello World', 'cowsay Welcome to WebLinuxOS']
})

registerCommand('cowthink', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const output = [
      ' _______________',
      '( ' + (args.join(' ') || 'Hmm...') + ' )',
      ' ---------------',
      '        o   ^__^',
      '         o  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ].join('\n')
    
    return { output }
  },
  description: '让牛思考',
  usage: 'cowthink <消息>',
  examples: ['cowthink What to do?']
})

registerCommand('dog', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const output = [
      ' ___________________________',
      '/ ' + (args.join(' ') || 'Woof Woof!') + ' \\',
      ' ---------------------------',
      '     \\',
      '      \\',
      '        / \\__',
      '       (    @\\___',
      '       /         O',
      '      /   (_____/',
      '     /_____/   U',
    ].join('\n')
    
    return { output }
  },
  description: '让狗狗说话',
  usage: 'dog <消息>',
  examples: ['dog Woof!']
})

registerCommand('fortune', {
  handler: (): CommandResult => {
    const fortunes = [
      '成功不是最终的，失败也不是致命的：重要的是继续前进的勇气。 - Winston Churchill',
      '生活不是等待风暴过去，而是学会在雨中翩翩起舞。 - Vivian Greene',
      '唯一不可能的事是你不去尝试。 - Audrey Hepburn',
      '成功的秘诀在于始终如一地坚持目标。 - Benjamin Disraeli',
      '不要等待机会，而要创造机会。 - Abraham Lincoln',
      '人生最大的错误是不断担心会犯错。 - Elbert Hubbard',
      '每一个不曾起舞的日子，都是对生命的辜负。 - 尼采',
      '你的时间有限，不要浪费在重复别人的生活上。 - Steve Jobs',
      '只有那些敢于相信自己内心深处有比现实更大力量的人，才能改变世界。 - J.K. Rowling',
      '成功的路上并不拥挤，因为坚持的人不多。',
      '今天的努力是明天的实力。',
      '相信自己，一切皆有可能。',
      '知识就是力量。 - Francis Bacon',
      '时间是最公平的资源，每个人每天都有24小时。',
      '不要让昨天占据今天太多时间。',
    ]
    
    return { output: fortunes[Math.floor(Math.random() * fortunes.length)] }
  },
  description: '显示随机名言',
  usage: 'fortune',
  examples: ['fortune']
})

registerCommand('sl', {
  handler: (): CommandResult => {
    const output = [
      '      (@@) (  ) (@)  ( )  @@    ()    @     O     @     O      @',
      '   (   )    ) (    )   )  _)\\ /\\_   _)\\ /\\_    )\\ /\\_    )\\ /\\_',
      '  (@@@@@@)()@@@()()@@@()@@()  @    @()  @   @()  @   @()  @',
      '  (    )  (_)  (_)  (_)  (_)   )\\  )\\   )\\  )\\   )\\  )\\',
      '  (@@@@@@  @    @    @    @    @   @    @   @    @   @',
      '           _)\\  _)\\  _)\\  _)\\  _)\\  _)\\  _)\\  _)\\',
      '',
      '🚂 火车经过！',
    ].join('\n')
    
    return { output }
  },
  description: '显示火车动画',
  usage: 'sl',
  examples: ['sl']
})

registerCommand('banner', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ') || 'BANNER'
    
    const bannerChars: Record<string, string[]> = {
      'A': ['  ██████  ', ' ██    ██ ', ' ████████ ', ' ██    ██ ', ' ██    ██ '],
      'B': [' ██████   ', ' ██   ██  ', ' ██████   ', ' ██   ██  ', ' ██████   '],
      'C': ['  ██████  ', ' ██       ', ' ██       ', ' ██       ', '  ██████  '],
      'D': [' █████    ', ' ██   ██  ', ' ██   ██  ', ' ██   ██  ', ' █████    '],
      'E': [' ███████  ', ' ██       ', ' ██████   ', ' ██       ', ' ███████  '],
      'F': [' ███████  ', ' ██       ', ' ██████   ', ' ██       ', ' ██       '],
      'G': ['  ██████  ', ' ██       ', ' ██   ██  ', ' ██   ██  ', '  ██████  '],
      'H': [' ██   ██  ', ' ██   ██  ', ' ████████ ', ' ██   ██  ', ' ██   ██  '],
      'I': ['  ██████  ', '    ██    ', '    ██    ', '    ██    ', '  ██████  '],
      'J': ['     ████ ', '       ██ ', '       ██ ', ' ██   ██  ', '  █████   '],
      'K': [' ██   ██  ', ' ██  ██   ', ' █████    ', ' ██  ██   ', ' ██   ██  '],
      'L': [' ██       ', ' ██       ', ' ██       ', ' ██       ', ' ███████  '],
      'M': [' ██   ██  ', ' ███ ███  ', ' ██ █ ██  ', ' ██   ██  ', ' ██   ██  '],
      'N': [' ██   ██  ', ' ███  ██  ', ' ██ █ ██  ', ' ██  ███  ', ' ██   ██  '],
      'O': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
      'P': [' ██████   ', ' ██   ██  ', ' ██████   ', ' ██       ', ' ██       '],
      'Q': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██  ███  ', '  ██████  '],
      'R': [' ██████   ', ' ██   ██  ', ' ██████   ', ' ██  ██   ', ' ██   ██  '],
      'S': ['  ██████  ', ' ██       ', '  ██████  ', '       ██ ', ' ██████   '],
      'T': [' ████████ ', '    ██    ', '    ██    ', '    ██    ', '    ██    '],
      'U': [' ██   ██  ', ' ██   ██  ', ' ██   ██  ', ' ██   ██  ', '  ██████  '],
      'V': [' ██   ██  ', ' ██   ██  ', ' ██   ██  ', '  ██ ██   ', '   ███    '],
      'W': [' ██   ██  ', ' ██   ██  ', ' ██ █ ██  ', ' ███ ███  ', ' ██   ██  '],
      'X': [' ██   ██  ', '  ██ ██   ', '   ███    ', '  ██ ██   ', ' ██   ██  '],
      'Y': [' ██   ██  ', '  ██ ██   ', '   ███    ', '    ██    ', '    ██    '],
      'Z': [' ████████ ', '       ██ ', '      ██  ', '    ██    ', ' ████████ '],
      ' ': ['          ', '          ', '          ', '          ', '          '],
      '0': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
      '1': ['    ██    ', '   ███    ', '    ██    ', '    ██    ', ' ███████  '],
      '2': ['  ██████  ', '       ██ ', '  ██████  ', ' ██       ', ' ████████ '],
      '3': ['  ██████  ', '       ██ ', '  ██████  ', '       ██ ', '  ██████  '],
      '4': [' ██    ██ ', ' ██    ██ ', ' ████████ ', '       ██ ', '       ██ '],
      '5': [' ████████ ', ' ██       ', ' ███████  ', '       ██ ', '  ██████  '],
      '6': ['  ██████  ', ' ██       ', ' ███████  ', ' ██    ██ ', '  ██████  '],
      '7': [' ████████ ', '       ██ ', '      ██  ', '     ██   ', '    ██    '],
      '8': ['  ██████  ', ' ██    ██ ', '  ██████  ', ' ██    ██ ', '  ██████  '],
      '9': ['  ██████  ', ' ██    ██ ', '  ███████ ', '       ██ ', '  ██████  '],
    }
    
    const lines: string[] = ['', '', '', '', '']
    for (const char of text.toUpperCase()) {
      const chars = bannerChars[char] || bannerChars[' ']
      for (let i = 0; i < 5; i++) {
        lines[i] += chars[i] + '  '
      }
    }
    
    return { output: lines.join('\n') }
  },
  description: '显示横幅文字',
  usage: 'banner <文本>',
  examples: ['banner HELLO', 'banner WebLinux']
})

registerCommand('lolcat', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ') || 'RAINBOW!'
    
    const colors = ['31', '33', '32', '36', '34', '35']
    const escapeChar = String.fromCharCode(27)
    let result = ''
    
    for (let i = 0; i < text.length; i++) {
      const color = colors[i % colors.length]
      result += `${escapeChar}[${color}m${text[i]}${escapeChar}[0m`
    }
    
    return { output: result }
  },
  description: '彩虹文字效果',
  usage: 'lolcat <文本>',
  examples: ['lolcat Hello World']
})

registerCommand('starwars', {
  handler: (): CommandResult => {
    const output = [
      '   ____  ___  ____   ___  ____  ___  ____',
      '  / __/ / _ \\|_  /  / _ \\/ __ \\/ _ \\/ __/',
      ' _\\ \\  / ___// /  / , _/ /_/ / , _/ _/  ',
      '/___/ /_/  /___/ /_/|_|\\____/_/|_/___/  ',
      '                                       ',
      '  May the Force be with you!',
    ].join('\n')
    
    return { output }
  },
  description: '星球大战ASCII艺术',
  usage: 'starwars',
  examples: ['starwars']
})

registerCommand('matrix', {
  handler: (): CommandResult => {
    const matrixLines: string[] = []
    for (let i = 0; i < 20; i++) {
      let line = ''
      for (let j = 0; j < 50; j++) {
        line += String.fromCharCode(0x30A0 + Math.random() * 96)
      }
      matrixLines.push(line)
    }
    
    return { output: matrixLines.join('\n') }
  },
  description: '黑客帝国效果',
  usage: 'matrix',
  examples: ['matrix']
})

registerCommand('asciiart', {
  handler: (): CommandResult => {
    const asciiArts = [
      [
        '   _     _',
        '  (a\\___/a)',
        ' /         \\',
        ' \\ =\\   /= /',
        '  |   ___   |',
        '  |  (   )  |',
        '  |___\\_/___|',
      ],
      [
        '     .----.',
        '    /      \\',
        '   |  O  O  |',
        '   |   __   |',
        '   |  /  \\  |',
        '   |  \\__/  |',
        '   \\        /',
        '    \'------\'',
      ],
      [
        '   ___   ___',
        '  /   \\ /   \\',
        ' |  O | | O  |',
        ' |    | |    |',
        '  \\  /   \\  /',
        '   \\/     \\/',
        '    \\     /',
        '     \\___/',
      ],
    ]
    
    const artIndex = Math.floor(Math.random() * asciiArts.length)
    return { output: asciiArts[artIndex].join('\n') }
  },
  description: '随机ASCII艺术',
  usage: 'asciiart',
  examples: ['asciiart']
})

registerCommand('joke', {
  handler: (): CommandResult => {
    const jokes = [
      '为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 等于 Dec 25！',
      '程序员最讨厌的数字是什么？是 0，因为它总是让程序崩溃。',
      '为什么程序员喜欢黑暗？因为他们是 Gopher！（Go语言程序员）',
      '为什么代码审查像茶？因为需要仔细品味才能发现问题。',
      'SQL 语句走进酒吧，酒保问："你要什么？" SQL 说："给我一杯 JOIN！"',
      '为什么 Java 程序员总是很冷静？因为他们有很多 Exception（例外）。',
      '前端开发者的烦恼：IE11 还活着吗？',
      '为什么 JavaScript 程序员总是很忙？因为他们要处理 Promise。',
    ]
    
    return { output: jokes[Math.floor(Math.random() * jokes.length)] }
  },
  description: '程序员笑话',
  usage: 'joke',
  examples: ['joke']
})

registerCommand('advice', {
  handler: (): CommandResult => {
    const advices = [
      '写代码前先写测试，这样可以避免很多bug。',
      '代码可读性比代码效率更重要，除非效率问题很严重。',
      '不要重复造轮子，使用成熟的库和框架。',
      '定期清理代码中的技术债务，不要让它堆积。',
      '代码审查是发现问题的好方法，不要害怕被审查。',
      '学习一门新语言或技术可以帮助你更好地理解编程。',
      '保持代码简洁，避免过度设计。',
      '文档是代码的重要组成部分，不要忽视它。',
    ]
    
    return { output: advices[Math.floor(Math.random() * advices.length)] }
  },
  description: '编程建议',
  usage: 'advice',
  examples: ['advice']
})

registerCommand('flip', {
  handler: (): CommandResult => {
    const result = Math.random() > 0.5 ? '正面 ✅' : '反面 ❌'
    return { output: `抛硬币结果: ${result}` }
  },
  description: '抛硬币',
  usage: 'flip',
  examples: ['flip']
})

registerCommand('rps', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const choices = ['石头', '剪刀', '布']
    const userChoice = args[0]
    
    if (!userChoice || !choices.includes(userChoice)) {
      return {
        output: [
          '✊ 石头剪刀布',
          '',
          '用法: rps <石头|剪刀|布>',
          '',
          '示例:',
          '  rps 石头',
          '  rps 剪刀',
          '  rps 布',
        ].join('\n')
      }
    }
    
    const computerChoice = choices[Math.floor(Math.random() * choices.length)]
    
    const result = userChoice === computerChoice
      ? '平局！'
      : (userChoice === '石头' && computerChoice === '剪刀') ||
        (userChoice === '剪刀' && computerChoice === '布') ||
        (userChoice === '布' && computerChoice === '石头')
        ? '你赢了！'
        : '电脑赢了！'
    
    return {
      output: [
        `你: ${userChoice}`,
        `电脑: ${computerChoice}`,
        '',
        result,
      ].join('\n')
    }
  },
  description: '石头剪刀布游戏',
  usage: 'rps <石头|剪刀|布>',
  examples: ['rps 石头', 'rps 剪刀']
})

registerCommand('bacon', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const baconText = (args.join(' ') || 'BACON').split('').map(c => {
      const binary = c.charCodeAt(0).toString(2).padStart(8, '0')
      return binary.split('').map(b => b === '1' ? ' bacon' : ' Bacon').join('')
    }).join('\n')
    
    return { output: baconText }
  },
  description: 'Bacon编码',
  usage: 'bacon <文本>',
  examples: ['bacon Hello']
})

registerCommand('welcome', {
  handler: (): CommandResult => {
    const output = [
      '🎉 欢迎使用 WebLinuxOS 终端 v2.3!',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📚 新手指南:',
      '',
      '1️⃣  基本操作:',
      '   • ls - 列出文件',
      '   • cd - 切换目录',
      '   • cat - 查看文件内容',
      '   • pwd - 显示当前路径',
      '',
      '2️⃣  系统工具:',
      '   • neofetch - 系统信息',
      '   • dashboard - 系统仪表盘',
      '   • sysinfo - 详细信息',
      '   • top - 进程监控',
      '',
      '3️⃣  趣味命令:',
      '   • cowsay <消息> - 让牛说话',
      '   • fortune - 随机名言',
      '   • matrix - 黑客帝国效果',
      '   • starwars - 星球大战',
      '',
      '4️⃣  实用工具:',
      '   • calc <表达式> - 数学计算',
      '   • prime <数字> - 质数查询',
      '   • weather - 天气预报',
      '   • search <关键词> - 搜索文件',
      '',
      '5️⃣  键盘快捷键:',
      '   • Ctrl+L - 清空终端',
      '   • ↑/↓ - 命令历史',
      '   • Tab - 自动补全',
      '   • Ctrl+C - 中断命令',
      '',
      '💡 提示: 输入 "help" 查看所有命令',
      '',
      '🔗 常用应用快捷键:',
      '   • Ctrl+Shift+T - 终端',
      '   • Ctrl+Shift+F - 文件管理器',
      '   • Ctrl+Shift+K - 智慧搜索',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '祝你使用愉快! 🎊',
    ].join('\n')
    
    return { output }
  },
  description: '显示新手指南',
  usage: 'welcome',
  examples: ['welcome']
})

registerCommand('help', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const allCommands = listCommands()
    
    if (args.length > 0) {
      const cmdName = args[0].toLowerCase()
      const cmd = getCommand(cmdName)
      if (cmd) {
        const output = [
          `命令: ${cmdName}`,
          `描述: ${cmd.description}`,
          cmd.usage ? `用法: ${cmd.usage}` : '',
          cmd.examples && cmd.examples.length > 0 ? `示例:\n  ${cmd.examples.join('\n  ')}` : '',
        ].filter(Boolean).join('\n')
        return { output }
      } else {
        return { output: `命令 "${cmdName}" 不存在` }
      }
    }
    
    const categories: Record<string, string[]> = {
      '文件操作': ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'tree', 'grep', 'find', 'stat', 'ln', 'chmod', 'head', 'tail', 'less', 'wc', 'diff'],
      '系统信息': ['whoami', 'hostname', 'date', 'uname', 'lsb_release', 'neofetch', 'version', 'uptime', 'ps', 'top', 'cpu-info', 'memory-info', 'system-info', 'credits', 'about'],
      '网络命令': ['curl', 'fetch', 'ip', 'ping', 'news', 'weather', 'netstat', 'dnslookup', 'iplookup'],
      '实用工具': ['calc', 'base64', 'hash', 'uuid', 'password', 'qrcode', 'color', 'timer', 'stopwatch', 'convert'],
      '趣味命令': ['cowsay', 'cowthink', 'dog', 'fortune', 'sl', 'banner', 'lolcat', 'starwars', 'matrix', 'asciiart', 'joke', 'advice', 'flip', 'rps', 'bacon'],
      '应用启动': ['terminal', 'files', 'browser', 'settings', 'calculator', 'editor', 'dashboard', 'launcher'],
      '开发工具': ['python', 'run', 'api', 'json', 'yaml', 'regex'],
    }
    
    const maxCmdLen = Math.max(...allCommands.map(c => c.length))
    
    const lines: string[] = [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                     WebLinuxOS 终端帮助                      ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
      `总计: ${allCommands.length} 个可用命令`,
      '',
      '使用 "help <命令>" 查看详细用法',
      '',
    ]
    
    for (const [category, cmds] of Object.entries(categories)) {
      lines.push(`━━━ ${category} ━━━`)
      for (const cmd of cmds.sort()) {
        if (allCommands.includes(cmd)) {
          const def = getCommand(cmd)
          if (def) {
            const padding = ' '.repeat(maxCmdLen - cmd.length)
            lines.push(`  ${cmd}${padding}  ${def.description}`)
          }
        }
      }
      lines.push('')
    }
    
    return { output: lines.join('\n') }
  },
  description: '显示帮助信息',
  usage: 'help [命令]',
  examples: ['help', 'help curl', 'help weather']
})

registerCommand('timer', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const seconds = parseInt(args[0]) || 60
    
    if (seconds <= 0 || seconds > 3600) {
      return { output: '请输入 1-3600 秒之间的值' }
    }
    
    return { 
      output: `⏱️ 计时器已设置: ${seconds} 秒\n计时开始... (实际计时需要前端交互支持)` 
    }
  },
  description: '设置计时器（秒）',
  usage: 'timer <秒数>',
  examples: ['timer 60', 'timer 300']
})

registerCommand('stopwatch', {
  handler: (): CommandResult => {
    return { output: '⏱️ 秒表已启动 (实际计时需要前端交互支持)' }
  },
  description: '启动秒表',
  usage: 'stopwatch',
  examples: ['stopwatch']
})

registerCommand('convert', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 3) {
      return {
        output: [
          '🔄 单位转换器',
          '',
          '用法: convert <数值> <单位1> <单位2>',
          '',
          '支持单位:',
          '  长度: m, cm, mm, km, in, ft, yd, mi',
          '  重量: kg, g, mg, lb, oz',
          '  温度: C, F, K',
          '  数据: B, KB, MB, GB, TB',
          '',
          '示例:',
          '  convert 100 km mi',
          '  convert 32 C F',
          '  convert 1 GB MB',
        ].join('\n')
      }
    }
    
    const value = parseFloat(args[0])
    const from = args[1].toLowerCase()
    const to = args[2].toLowerCase()
    
    if (isNaN(value)) {
      return { output: '无效的数值' }
    }
    
    const conversions: Record<string, Record<string, number>> = {
      m: { cm: 100, mm: 1000, km: 0.001, in: 39.3701, ft: 3.28084, yd: 1.09361, mi: 0.000621371 },
      cm: { m: 0.01, mm: 10, km: 0.00001, in: 0.393701, ft: 0.0328084, yd: 0.0109361, mi: 0.00000621371 },
      kg: { g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274 },
      g: { kg: 0.001, mg: 1000, lb: 0.00220462, oz: 0.035274 },
      b: { kb: 0.0009765625, mb: 0.00000095367, gb: 0.00000000093132, tb: 0.00000000000090949 },
      kb: { b: 1024, mb: 0.0009765625, gb: 0.00000095367, tb: 0.00000000093132 },
      mb: { b: 1048576, kb: 1024, gb: 0.0009765625, tb: 0.00000095367 },
      gb: { b: 1073741824, kb: 1048576, mb: 1024, tb: 0.0009765625 },
      tb: { b: 1099511627776, kb: 1073741824, mb: 1048576, gb: 1024 },
    }
    
    let result: number
    
    if (from === to) {
      result = value
    } else if (from === 'c' && to === 'f') {
      result = value * 9/5 + 32
    } else if (from === 'f' && to === 'c') {
      result = (value - 32) * 5/9
    } else if (from === 'c' && to === 'k') {
      result = value + 273.15
    } else if (from === 'k' && to === 'c') {
      result = value - 273.15
    } else if (from === 'f' && to === 'k') {
      result = (value - 32) * 5/9 + 273.15
    } else if (from === 'k' && to === 'f') {
      result = (value - 273.15) * 9/5 + 32
    } else if (conversions[from] && conversions[from][to]) {
      result = value * conversions[from][to]
    } else {
      return { output: `不支持的转换: ${from} -> ${to}` }
    }
    
    return { output: `${value} ${from} = ${result.toFixed(6).replace(/\.?0+$/, '')} ${to}` }
  },
  description: '单位转换',
  usage: 'convert <数值> <单位1> <单位2>',
  examples: ['convert 100 km mi', 'convert 32 C F', 'convert 1 GB MB']
})

registerCommand('shortcuts', {
  handler: (): CommandResult => {
    const output = [
      '⌨️  WebLinuxOS 键盘快捷键',
      '',
      '━━━ 系统级快捷键 ━━━',
      '  Ctrl+Shift+L       打开应用启动器',
      '  Ctrl+Shift+K       全局搜索',
      '  Ctrl+Shift+P       命令面板',
      '  Ctrl+Alt+1-9       切换桌面 1-9',
      '  Ctrl+Alt+←/→       上一个/下一个桌面',
      '  Ctrl+Shift+Alt+1-9 移动窗口到桌面',
      '  Alt+Tab            窗口循环切换',
      '  Ctrl+W             关闭聚焦窗口',
      '  Ctrl+M             最小化窗口',
      '  F11                切换全屏',
      '',
      '━━━ 应用快速启动 ━━━',
      '  Ctrl+T             终端',
      '  Ctrl+E             文件管理器',
      '  Ctrl+B             Web 浏览器',
      '  Ctrl+,             系统设置',
      '  Ctrl+G             代码编辑器',
      '  Ctrl+D             系统监视器',
      '  Ctrl+Shift+C        计算器',
      '  Ctrl+Shift+N        笔记',
      '  Ctrl+Shift+W        天气',
      '  Ctrl+Shift+M        音乐播放器',
      '',
      '━━━ 终端内快捷键 ━━━',
      '  Ctrl+L             清空终端',
      '  ↑/↓               命令历史',
      '  Tab                自动补全',
      '  Ctrl+C             中断命令',
      '  Ctrl+A             行首',
      '  Ctrl+E             行尾',
      '  Ctrl+U             删除整行',
      '  Ctrl+K             删除光标后字符',
    ].join('\n')
    
    return { output }
  },
  description: '显示键盘快捷键',
  usage: 'shortcuts',
  examples: ['shortcuts']
})