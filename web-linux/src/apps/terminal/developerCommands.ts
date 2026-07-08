import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('base64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔐 Base64 编解码工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  base64 encode <文本>',
          '  base64 decode <base64字符串>',
          '',
          '示例:',
          '  base64 encode hello world',
          '  base64 decode aGVsbG8gd29ybGQ=',
          '',
        ].join('\n')
      }
    }
    
    const action = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    if (action === 'encode') {
      const encoded = btoa(text)
      return {
        output: [
          '🔐 Base64 编码结果',
          '═'.repeat(40),
          '',
          `原文: ${text}`,
          '',
          `编码: ${encoded}`,
          '',
        ].join('\n')
      }
    } else if (action === 'decode') {
      try {
        const decoded = atob(text)
        return {
          output: [
            '🔐 Base64 解码结果',
            '═'.repeat(40),
            '',
            `编码: ${text}`,
            '',
            `原文: ${decoded}`,
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 无效的Base64字符串' }
      }
    } else {
      return { output: `未知操作: ${action}，请使用 encode 或 decode` }
    }
  },
  description: 'Base64编解码',
  usage: 'base64 <encode|decode> <文本>',
  examples: ['base64 encode hello', 'base64 decode aGVsbG8=']
})

registerCommand('hash', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔒 哈希生成工具',
          '═'.repeat(40),
          '',
          '用法: hash <算法> <文本>',
          '',
          '支持的算法:',
          '  md5, sha1, sha256, sha512',
          '',
          '示例:',
          '  hash md5 hello',
          '  hash sha256 secret',
          '',
        ].join('\n')
      }
    }
    
    const algorithm = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    const validAlgorithms = ['md5', 'sha1', 'sha256', 'sha512']
    
    if (!validAlgorithms.includes(algorithm)) {
      return { output: `不支持的算法: ${algorithm}\n支持: ${validAlgorithms.join(', ')}` }
    }
    
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hash = await crypto.subtle.digest(algorithm.toUpperCase(), data)
      
      const hex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      return {
        output: [
          '🔒 哈希结果',
          '═'.repeat(40),
          '',
          `算法: ${algorithm.toUpperCase()}`,
          `原文: ${text}`,
          '',
          `哈希值: ${hex}`,
          '',
        ].join('\n')
      }
    } catch {
      return { output: '错误: 无法计算哈希值' }
    }
  },
  description: '生成文本哈希值',
  usage: 'hash <算法> <文本>',
  examples: ['hash md5 hello', 'hash sha256 secret']
})

registerCommand('uuid', {
  handler: (): CommandResult => {
    const uuid = crypto.randomUUID()
    
    return {
      output: [
        '🆔 UUID 生成器',
        '═'.repeat(40),
        '',
        `UUID: ${uuid}`,
        '',
        '已复制到剪贴板',
        '',
      ].join('\n')
    }
  },
  description: '生成UUID',
  usage: 'uuid',
  examples: ['uuid']
})

registerCommand('json', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📋 JSON 工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  json format <JSON字符串>',
          '  json minify <JSON字符串>',
          '',
          '示例:',
          '  json format {"name":"test"}',
          '  json minify {"name": "test"}',
          '',
        ].join('\n')
      }
    }
    
    const action = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    if (action === 'format') {
      try {
        const parsed = JSON.parse(text)
        const formatted = JSON.stringify(parsed, null, 2)
        return {
          output: [
            '📋 JSON 格式化',
            '═'.repeat(40),
            '',
            formatted,
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 无效的JSON格式' }
      }
    } else if (action === 'minify') {
      try {
        const parsed = JSON.parse(text)
        const minified = JSON.stringify(parsed)
        return {
          output: [
            '📋 JSON 压缩',
            '═'.repeat(40),
            '',
            minified,
            '',
            `原始: ${text.length} 字符`,
            `压缩: ${minified.length} 字符`,
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 无效的JSON格式' }
      }
    } else {
      return { output: `未知操作: ${action}，请使用 format 或 minify` }
    }
  },
  description: 'JSON格式化/压缩',
  usage: 'json <format|minify> <JSON>',
  examples: ['json format {"a":1}', 'json minify {"a": 1}']
})

registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const now = new Date()
      return {
        output: [
          '⏱️ 当前时间戳',
          '═'.repeat(40),
          '',
          `当前时间: ${now.toLocaleString('zh-CN')}`,
          `Unix时间戳(秒): ${Math.floor(now.getTime() / 1000)}`,
          `Unix时间戳(毫秒): ${now.getTime()}`,
          `ISO格式: ${now.toISOString()}`,
          '',
        ].join('\n')
      }
    }
    
    const timestamp = parseInt(args[0])
    
    if (isNaN(timestamp)) {
      return { output: '错误: 请输入有效的时间戳数字' }
    }
    
    const date = new Date(timestamp * (timestamp.toString().length < 13 ? 1000 : 1))
    
    return {
      output: [
        '⏱️ 时间戳转换',
        '═'.repeat(40),
        '',
        `时间戳: ${timestamp}`,
        '',
        `转换结果: ${date.toLocaleString('zh-CN')}`,
        `UTC时间: ${date.toISOString()}`,
        `时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        '',
      ].join('\n')
    }
  },
  description: '时间戳转换',
  usage: 'timestamp [时间戳]',
  examples: ['timestamp', 'timestamp 1699999999']
})

registerCommand('color', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🎨 颜色转换工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  color hex <HEX颜色>',
          '  color rgb <R> <G> <B>',
          '  color list',
          '',
          '示例:',
          '  color hex #ff5733',
          '  color rgb 255 87 51',
          '  color list',
          '',
        ].join('\n')
      }
    }
    
    const action = args[0].toLowerCase()
    
    if (action === 'list') {
      const colors = [
        { name: '红色', hex: '#FF0000', rgb: '255, 0, 0' },
        { name: '绿色', hex: '#00FF00', rgb: '0, 255, 0' },
        { name: '蓝色', hex: '#0000FF', rgb: '0, 0, 255' },
        { name: '黄色', hex: '#FFFF00', rgb: '255, 255, 0' },
        { name: '紫色', hex: '#800080', rgb: '128, 0, 128' },
        { name: '青色', hex: '#00FFFF', rgb: '0, 255, 255' },
        { name: '橙色', hex: '#FFA500', rgb: '255, 165, 0' },
        { name: '粉色', hex: '#FF69B4', rgb: '255, 105, 180' },
        { name: '灰色', hex: '#808080', rgb: '128, 128, 128' },
        { name: '黑色', hex: '#000000', rgb: '0, 0, 0' },
        { name: '白色', hex: '#FFFFFF', rgb: '255, 255, 255' },
        { name: '深蓝', hex: '#00008B', rgb: '0, 0, 139' },
        { name: '天蓝', hex: '#87CEEB', rgb: '135, 206, 235' },
        { name: '橄榄', hex: '#808000', rgb: '128, 128, 0' },
        { name: '银色', hex: '#C0C0C0', rgb: '192, 192, 192' },
      ]
      
      const output: string[] = ['🎨 常用颜色表', '═'.repeat(60), '', '名称        HEX        RGB', '─'.repeat(60)]
      colors.forEach(c => {
        output.push(`${c.name.padEnd(8)} ${c.hex.padEnd(10)} ${c.rgb}`)
      })
      output.push('')
      
      return { output: output.join('\n') }
    }
    
    if (action === 'hex') {
      const hex = args[1]?.replace('#', '') || ''
      
      if (hex.length !== 6 && hex.length !== 3) {
        return { output: '错误: HEX颜色必须为6位或3位' }
      }
      
      const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16)
      const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16)
      const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16)
      
      return {
        output: [
          '🎨 颜色转换结果',
          '═'.repeat(40),
          '',
          `HEX: #${hex.toUpperCase()}`,
          `RGB: ${r}, ${g}, ${b}`,
          `HSL: ${rgbToHsl(r, g, b)}`,
          '',
        ].join('\n')
      }
    }
    
    if (action === 'rgb') {
      const r = parseInt(args[1]) || 0
      const g = parseInt(args[2]) || 0
      const b = parseInt(args[3]) || 0
      
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
        return { output: '错误: RGB值必须在0-255范围内' }
      }
      
      const hex = '#' + 
        r.toString(16).padStart(2, '0').toUpperCase() +
        g.toString(16).padStart(2, '0').toUpperCase() +
        b.toString(16).padStart(2, '0').toUpperCase()
      
      return {
        output: [
          '🎨 颜色转换结果',
          '═'.repeat(40),
          '',
          `RGB: ${r}, ${g}, ${b}`,
          `HEX: ${hex}`,
          `HSL: ${rgbToHsl(r, g, b)}`,
          '',
        ].join('\n')
      }
    }
    
    return { output: `未知操作: ${action}` }
  },
  description: '颜色转换工具',
  usage: 'color <hex|rgb|list> [参数]',
  examples: ['color hex #ff5733', 'color rgb 255 87 51', 'color list']
})

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  return `${Math.round(h * 360)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`
}

registerCommand('env', {
  handler: (context: CommandContext): CommandResult => {
    const { username, hostname, theme, cwd } = context
    
    const output: string[] = [
      '🌐 环境变量',
      '═'.repeat(40),
      '',
      `USERNAME=${username}`,
      `HOSTNAME=${hostname}`,
      `THEME=${theme}`,
      `PWD=${cwd}`,
      `HOME=/home/${username}`,
      `PATH=/usr/local/bin:/usr/bin:/bin`,
      `SHELL=/bin/bash`,
      `TERM=xterm-256color`,
      `LANG=zh_CN.UTF-8`,
      '',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示环境变量',
  usage: 'env',
  examples: ['env']
})

registerCommand('history', {
  handler: (): CommandResult => {
    const history = [
      'ls -la',
      'cd /home/user/Documents',
      'cat README.md',
      'weather Beijing',
      'crypto',
      'git status',
      'npm run dev',
      'python app.py',
      'curl https://api.example.com',
      'help',
    ]
    
    const output: string[] = [
      '📜 命令历史',
      '═'.repeat(40),
      '',
    ]
    
    history.forEach((cmd, index) => {
      output.push(`${(index + 1).toString().padStart(3)}  ${cmd}`)
    })
    
    output.push('')
    output.push('提示: 使用上下箭头键浏览历史命令')
    
    return { output: output.join('\n') }
  },
  description: '显示命令历史',
  usage: 'history',
  examples: ['history']
})

registerCommand('clear', {
  handler: (): CommandResult => {
    return { output: '\x1b[2J\x1b[H' }
  },
  description: '清空终端屏幕',
  usage: 'clear',
  examples: ['clear']
})

registerCommand('regex', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔍 正则表达式测试工具',
          '═'.repeat(50),
          '',
          '用法: regex <正则表达式> <测试文本>',
          '',
          '示例:',
          '  regex ^[a-zA-Z]+$ hello',
          '  regex \\d+ 123abc456',
          '  regex email@example\\.com test@example.com',
          '',
          '提示: 特殊字符需要转义',
          '',
        ].join('\n')
      }
    }
    
    const pattern = args[0]
    const text = args.slice(1).join(' ')
    
    try {
      const regex = new RegExp(pattern)
      const matches = text.match(regex)
      const testResult = regex.test(text)
      
      const output: string[] = []
      output.push('🔍 正则表达式测试结果')
      output.push('═'.repeat(50))
      output.push('')
      output.push(`正则: /${pattern}/`)
      output.push(`测试: "${text}"`)
      output.push('')
      output.push(`匹配: ${testResult ? '✅ 匹配成功' : '❌ 匹配失败'}`)
      
      if (matches) {
        output.push('')
        output.push('匹配结果:')
        matches.forEach((match, index) => {
          output.push(`  ${index + 1}. "${match}"`)
        })
      }
      
      output.push('')
      
      return { output: output.join('\n') }
    } catch {
      return { output: `错误: 无效的正则表达式: ${pattern}` }
    }
  },
  description: '正则表达式测试',
  usage: 'regex <正则> <文本>',
  examples: ['regex ^[a-z]+$ hello', 'regex \\d+ 123abc']
})

registerCommand('diff', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '📝 文本比较工具',
          '═'.repeat(50),
          '',
          '用法: diff <文本1> <文本2>',
          '',
          '示例:',
          '  diff "hello world" "hello there"',
          '  diff "apple" "banana"',
          '',
        ].join('\n')
      }
    }
    
    const text1 = args[0]
    const text2 = args.slice(1).join(' ')
    
    const output: string[] = []
    output.push('📝 文本比较结果')
    output.push('═'.repeat(50))
    output.push('')
    
    if (text1 === text2) {
      output.push('✅ 两个文本完全相同')
      output.push('')
      return { output: output.join('\n') }
    }
    
    output.push(`文本1: "${text1}"`)
    output.push(`文本2: "${text2}"`)
    output.push('')
    output.push('差异分析:')
    
    const maxLen = Math.max(text1.length, text2.length)
    let differing = false
    
    for (let i = 0; i < maxLen; i++) {
      const char1 = text1[i] || ''
      const char2 = text2[i] || ''
      
      if (char1 !== char2) {
        if (!differing) {
          output.push('')
          output.push(`  位置 ${i}:`)
          differing = true
        }
        output.push(`    文本1: "${char1 || '(空)'}"`)
        output.push(`    文本2: "${char2 || '(空)'}"`)
      }
    }
    
    output.push('')
    output.push(`文本1长度: ${text1.length} 字符`)
    output.push(`文本2长度: ${text2.length} 字符`)
    output.push(`差异字符数: ${Array.from({ length: maxLen }, (_, i) => text1[i] !== text2[i]).filter(Boolean).length}`)
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '比较两个文本的差异',
  usage: 'diff <文本1> <文本2>',
  examples: ['diff "hello" "hallo"']
})

registerCommand('count', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📊 字符统计工具',
          '═'.repeat(50),
          '',
          '用法: count <文本>',
          '',
          '示例:',
          '  count "Hello World"',
          '  count "这是一段测试文本"',
          '',
        ].join('\n')
      }
    }
    
    const text = args.join(' ')
    
    const charCount = text.length
    const charCountNoSpace = text.replace(/\s/g, '').length
    const wordCount = text.trim() ? text.split(/\s+/).length : 0
    const lineCount = text.split('\n').length
    const letterCount = (text.match(/[a-zA-Z]/g) || []).length
    const digitCount = (text.match(/\d/g) || []).length
    const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const punctuationCount = (text.match(/[.,!?;:'"，。！？；：""''、]/g) || []).length
    
    const output: string[] = []
    output.push('📊 字符统计结果')
    output.push('═'.repeat(50))
    output.push('')
    output.push(`原始文本: "${text}"`)
    output.push('')
    output.push(`总字符数: ${charCount}`)
    output.push(`不含空格: ${charCountNoSpace}`)
    output.push(`单词数: ${wordCount}`)
    output.push(`行数: ${lineCount}`)
    output.push(`英文字母: ${letterCount}`)
    output.push(`数字: ${digitCount}`)
    output.push(`中文字符: ${chineseCount}`)
    output.push(`标点符号: ${punctuationCount}`)
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '统计文本字符信息',
  usage: 'count <文本>',
  examples: ['count "Hello World"']
})

registerCommand('url', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔗 URL工具',
          '═'.repeat(50),
          '',
          '用法:',
          '  url encode <URL>',
          '  url decode <编码后的URL>',
          '',
          '示例:',
          '  url encode https://example.com?a=1&b=2',
          '  url decode https%3A%2F%2Fexample.com',
          '',
        ].join('\n')
      }
    }
    
    const action = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    if (action === 'encode') {
      try {
        const encoded = encodeURIComponent(text)
        return {
          output: [
            '🔗 URL编码结果',
            '═'.repeat(50),
            '',
            `原始: ${text}`,
            '',
            `编码: ${encoded}`,
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 编码失败' }
      }
    } else if (action === 'decode') {
      try {
        const decoded = decodeURIComponent(text)
        return {
          output: [
            '🔗 URL解码结果',
            '═'.repeat(50),
            '',
            `编码: ${text}`,
            '',
            `原始: ${decoded}`,
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 无效的编码字符串' }
      }
    } else {
      return { output: `未知操作: ${action}` }
    }
  },
  description: 'URL编码/解码',
  usage: 'url <encode|decode> <URL>',
  examples: ['url encode https://example.com', 'url decode https%3A%2F%2F']
})