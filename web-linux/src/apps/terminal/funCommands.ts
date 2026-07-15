import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

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
      '🎉 欢迎使用 WebLinuxOS 终端!',
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
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '祝你使用愉快! 🎊',
    ].join('\n')
    
    return { output }
  },
  description: '显示新手指南',
  usage: 'welcome',
  examples: ['welcome']
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