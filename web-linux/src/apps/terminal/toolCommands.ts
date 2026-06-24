import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

function safeEval(expression: string): number {
  const trimmed = expression.trim()
  if (!trimmed) throw new Error('表达式为空')

  const tokens: Array<{ type: 'num' | 'op' | 'func'; value: string }> = []
  let i = 0
  const FUNCTIONS = new Set(['sqrt', 'sin', 'cos', 'tan', 'log', 'log10', 'abs', 'ceil', 'floor', 'round', 'exp', 'pow', 'min', 'max', 'sign'])
  const CONSTANTS: Record<string, number> = { PI: Math.PI, E: Math.E, pi: Math.PI, e: Math.E }

  while (i < trimmed.length) {
    const ch = trimmed[i]
    if (ch === ' ') { i++; continue }
    if (/[0-9.]/.test(ch)) {
      let num = ''
      while (i < trimmed.length && /[0-9.]/.test(trimmed[i])) {
        num += trimmed[i]
        i++
      }
      if (isNaN(Number(num))) throw new Error('无效的数字: ' + num)
      tokens.push({ type: 'num', value: num })
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let word = ''
      while (i < trimmed.length && /[a-zA-Z0-9_]/.test(trimmed[i])) {
        word += trimmed[i]
        i++
      }
      if (word in CONSTANTS) {
        tokens.push({ type: 'num', value: String(CONSTANTS[word]) })
      } else if (FUNCTIONS.has(word.toLowerCase())) {
        tokens.push({ type: 'func', value: word.toLowerCase() })
      } else {
        throw new Error('未知标识符: ' + word)
      }
      continue
    }
    if ('+-*/%^(),'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }
    throw new Error('无效字符: ' + ch)
  }

  let pos = 0
  function peek() { return tokens[pos] }
  function eat(type: string, value?: string) {
    const t = tokens[pos]
    if (!t || t.type !== type || (value && t.value !== value)) {
      throw new Error('期望 ' + value + ' 但得到 ' + (t?.value || 'EOF'))
    }
    pos++
    return t
  }

  function parseExpression(): number {
    let value = parseTerm()
    while (peek() && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = eat('op').value
      const right = parseTerm()
      value = op === '+' ? value + right : value - right
    }
    return value
  }
  function parseTerm(): number {
    let value = parseFactor()
    while (peek() && (peek()!.value === '*' || peek()!.value === '/' || peek()!.value === '%')) {
      const op = eat('op').value
      const right = parseFactor()
      if (op === '*') value = value * right
      else if (op === '/') { if (right === 0) throw new Error('除零错误'); value = value / right }
      else value = value % right
    }
    return value
  }
  function parseFactor(): number {
    const t = peek()
    if (!t) throw new Error('意外的表达式结尾')
    if (t.type === 'op' && t.value === '+') { pos++; return parseFactor() }
    if (t.type === 'op' && t.value === '-') { pos++; return -parseFactor() }
    if (t.type === 'op' && t.value === '(') {
      pos++
      const value = parseExpression()
      eat('op', ')')
      const next = peek()
      if (next && next.type === 'op' && next.value === '^') {
        pos++
        const exp = parseFactor()
        return Math.pow(value, exp)
      }
      return value
    }
    if (t.type === 'func') {
      pos++
      eat('op', '(')
      if (t.value === 'pow' || t.value === 'min' || t.value === 'max') {
        const args: number[] = [parseExpression()]
        while (peek() && peek()!.value === ',') { pos++; args.push(parseExpression()) }
        eat('op', ')')
        if (t.value === 'pow') return Math.pow(args[0], args[1])
        if (t.value === 'min') return Math.min(...args)
        if (t.value === 'max') return Math.max(...args)
      }
      const arg = parseExpression()
      eat('op', ')')
      switch (t.value) {
        case 'sqrt': return Math.sqrt(arg)
        case 'sin': return Math.sin(arg)
        case 'cos': return Math.cos(arg)
        case 'tan': return Math.tan(arg)
        case 'log': return Math.log(arg)
        case 'log10': return Math.log10(arg)
        case 'abs': return Math.abs(arg)
        case 'ceil': return Math.ceil(arg)
        case 'floor': return Math.floor(arg)
        case 'round': return Math.round(arg)
        case 'exp': return Math.exp(arg)
        case 'sign': return Math.sign(arg)
        default: throw new Error('未知函数: ' + t.value)
      }
    }
    if (t.type === 'num') {
      pos++
      const num = Number(t.value)
      const next = peek()
      if (next && next.type === 'op' && next.value === '^') {
        pos++
        const exp = parseFactor()
        return Math.pow(num, exp)
      }
      return num
    }
    throw new Error('意外的 token: ' + t.value)
  }

  const result = parseExpression()
  if (pos !== tokens.length) throw new Error('表达式末尾存在多余内容')
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('结果不是有效数字')
  return result
}

registerCommand('calc', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const expression = args.join(' ')
    
    if (!expression) {
      return {
        output: [
          '🧮 计算器',
          '',
          '用法: calc <数学表达式>',
          '',
          '支持的运算符: +, -, *, /, %, **, ()',
          '支持的函数: sqrt, sin, cos, tan, log, log10, abs, ceil, floor, round',
          '支持的常量: PI, E',
          '',
          '示例:',
          '  calc 2 + 3 * 4',
          '  calc (2 + 3) * 4',
          '  calc 2 ** 10',
          '  calc sqrt(16)',
          '  calc sin(3.14)',
        ].join('\n')
      }
    }
    
    try {
      const result = safeEval(expression)
      return { output: `= ${result}` }
    } catch (e) {
      return { output: `calc: 表达式错误 - ${(e as Error).message}` }
    }
  },
  description: '数学计算器',
  usage: 'calc <表达式>',
  examples: ['calc 2 + 3', 'calc sqrt(16)', 'calc sin(PI)']
})

registerCommand('prime', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const num = parseInt(args[0])
    
    if (isNaN(num)) {
      return {
        output: [
          '🔢 质数检测',
          '',
          '用法: prime <数字>',
          '',
          '示例:',
          '  prime 17',
          '  prime 100',
        ].join('\n')
      }
    }
    
    const isPrime = (n: number): boolean => {
      if (n <= 1) return false
      if (n <= 3) return true
      if (n % 2 === 0 || n % 3 === 0) return false
      let i = 5
      while (i * i <= n) {
        if (n % i === 0 || n % (i + 2) === 0) return false
        i += 6
      }
      return true
    }
    
    if (isPrime(num)) {
      return { output: `${num} 是质数 ✅` }
    } else {
      return { output: `${num} 不是质数 ❌` }
    }
  },
  description: '检测数字是否为质数',
  usage: 'prime <数字>',
  examples: ['prime 17', 'prime 100']
})

registerCommand('factor', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const num = parseInt(args[0])
    
    if (isNaN(num) || num < 2) {
      return {
        output: [
          '🔧 质因数分解',
          '',
          '用法: factor <数字>',
          '',
          '示例:',
          '  factor 12',
          '  factor 100',
        ].join('\n')
      }
    }
    
    const factors: number[] = []
    let n = num
    while (n % 2 === 0) {
      factors.push(2)
      n /= 2
    }
    let i = 3
    while (i * i <= n) {
      while (n % i === 0) {
        factors.push(i)
        n /= i
      }
      i += 2
    }
    if (n > 2) factors.push(n)
    
    return { output: `${num} = ${factors.join(' × ')}` }
  },
  description: '质因数分解',
  usage: 'factor <数字>',
  examples: ['factor 12', 'factor 100']
})

registerCommand('roman', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const num = parseInt(args[0])
    
    if (isNaN(num) || num < 1 || num > 3999) {
      return {
        output: [
          '🔤 罗马数字转换',
          '',
          '用法: roman <数字> (1-3999)',
          '',
          '示例:',
          '  roman 2024',
          '  roman 1999',
        ].join('\n')
      }
    }
    
    const romanNumerals = [
      { value: 1000, symbol: 'M' },
      { value: 900, symbol: 'CM' },
      { value: 500, symbol: 'D' },
      { value: 400, symbol: 'CD' },
      { value: 100, symbol: 'C' },
      { value: 90, symbol: 'XC' },
      { value: 50, symbol: 'L' },
      { value: 40, symbol: 'XL' },
      { value: 10, symbol: 'X' },
      { value: 9, symbol: 'IX' },
      { value: 5, symbol: 'V' },
      { value: 4, symbol: 'IV' },
      { value: 1, symbol: 'I' },
    ]
    
    let result = ''
    let n = num
    for (const { value, symbol } of romanNumerals) {
      while (n >= value) {
        result += symbol
        n -= value
      }
    }
    
    return { output: `${num} = ${result}` }
  },
  description: '阿拉伯数字转罗马数字',
  usage: 'roman <数字>',
  examples: ['roman 2024', 'roman 1999']
})

registerCommand('base64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔐 Base64 编码',
          '',
          '用法: base64 <文本>',
          '',
          '示例:',
          '  base64 Hello World',
        ].join('\n')
      }
    }
    
    return { output: btoa(text) }
  },
  description: 'Base64编码',
  usage: 'base64 <文本>',
  examples: ['base64 Hello World']
})

registerCommand('unbase64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const encoded = args.join(' ')
    
    if (!encoded) {
      return {
        output: [
          '🔓 Base64 解码',
          '',
          '用法: unbase64 <编码文本>',
          '',
          '示例:',
          '  unbase64 SGVsbG8gV29ybGQ=',
        ].join('\n')
      }
    }
    
    try {
      return { output: atob(encoded) }
    } catch {
      return { output: 'unbase64: 无效的 Base64 编码' }
    }
  },
  description: 'Base64解码',
  usage: 'unbase64 <编码文本>',
  examples: ['unbase64 SGVsbG8gV29ybGQ=']
})

registerCommand('hash', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔑 哈希计算',
          '',
          '用法: hash <文本>',
          '',
          '示例:',
          '  hash password123',
        ].join('\n')
      }
    }
    
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return { output: `MD5-like: ${Math.abs(hash).toString(16).padStart(32, '0')}` }
  },
  description: '计算文本哈希值',
  usage: 'hash <文本>',
  examples: ['hash password123']
})

registerCommand('rev', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return { output: 'rev: 请提供要反转的文本' }
    }
    
    return { output: text.split('').reverse().join('') }
  },
  description: '反转文本',
  usage: 'rev <文本>',
  examples: ['rev hello', 'rev abc123']
})

registerCommand('json', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📋 JSON 格式化工具',
          '',
          '用法: json <JSON字符串>',
          '',
          '示例:',
          '  json {"name":"test","value":123}',
          '  echo \'{"a":1}\' | json',
          '',
          '💡 用于格式化和验证JSON数据',
        ].join('\n')
      }
    }
    
    try {
      const parsed = JSON.parse(args.join(' '))
      return { output: JSON.stringify(parsed, null, 2) }
    } catch (e) {
      return { output: `json: JSON格式错误 - ${(e as Error).message}` }
    }
  },
  description: 'JSON格式化和验证',
  usage: 'json <JSON字符串>',
  examples: ['json {"name":"test"}']
})

registerCommand('urlencode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔗 URL编码',
          '',
          '用法: urlencode <文本>',
          '',
          '示例:',
          '  urlencode Hello World!',
        ].join('\n')
      }
    }
    
    return { output: encodeURIComponent(text) }
  },
  description: 'URL编码',
  usage: 'urlencode <文本>',
  examples: ['urlencode Hello World!']
})

registerCommand('urldecode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔗 URL解码',
          '',
          '用法: urldecode <编码文本>',
          '',
          '示例:',
          '  urldecode Hello%20World%21',
        ].join('\n')
      }
    }
    
    try {
      return { output: decodeURIComponent(text) }
    } catch {
      return { output: 'urldecode: 无效的URL编码' }
    }
  },
  description: 'URL解码',
  usage: 'urldecode <编码文本>',
  examples: ['urldecode Hello%20World%21']
})

registerCommand('uuid', {
  handler: (): CommandResult => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    
    return { output: `生成的UUID:\n\n${uuid}` }
  },
  description: '生成UUID',
  usage: 'uuid',
  examples: ['uuid']
})

registerCommand('password', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const length = parseInt(args[0]) || 16
    
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    return { output: `🔐 生成的密码\n\n${password}\n\n长度: ${password.length} 字符` }
  },
  description: '生成随机密码',
  usage: 'password [长度]',
  examples: ['password', 'password 20']
})

registerCommand('weather', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    const weatherData: Record<string, { temp: number; desc: string; humidity: number; wind: string }> = {
      'beijing': { temp: 28, desc: '晴朗', humidity: 45, wind: '东北风 3级' },
      'shanghai': { temp: 32, desc: '多云', humidity: 65, wind: '东南风 4级' },
      'guangzhou': { temp: 35, desc: '雷阵雨', humidity: 80, wind: '南风 2级' },
      'shenzhen': { temp: 33, desc: '多云转晴', humidity: 70, wind: '东风 3级' },
      'chengdu': { temp: 25, desc: '阴', humidity: 75, wind: '微风' },
      'hangzhou': { temp: 30, desc: '晴', humidity: 55, wind: '西北风 2级' },
    }
    
    const lowerCity = city.toLowerCase()
    const data = weatherData[lowerCity] || { temp: Math.floor(Math.random() * 20) + 20, desc: '晴', humidity: Math.floor(Math.random() * 40) + 40, wind: '微风' }
    
    return {
      output: [
        `🌤️  ${city} 天气`,
        '',
        `温度: ${data.temp}°C`,
        `天气: ${data.desc}`,
        `湿度: ${data.humidity}%`,
        `风力: ${data.wind}`,
        '',
        '💡 提示: 使用 weather <城市名> 查询其他城市天气',
      ].join('\n')
    }
  },
  description: '查询天气',
  usage: 'weather [城市名]',
  examples: ['weather', 'weather Beijing', 'weather Shanghai']
})

registerCommand('quote', {
  handler: (): CommandResult => {
    const quotes = [
      { text: '生活不止眼前的苟且，还有诗和远方。', author: '高晓松' },
      { text: '不要等待机会，而要创造机会。', author: '林肯' },
      { text: '成功不是将来才有的，而是从决定去做的那一刻起，持续累积而成。', author: '俞敏洪' },
      { text: '人生最大的挑战是发现自己是谁，而第二大的挑战是对所发现的感到满意。', author: '罗杰·塞尔夫' },
      { text: '生命中最美好的事物都是免费的：微笑、拥抱、朋友、爱与美好的回忆。', author: '佚名' },
      { text: '每一天都是一个新的开始，你可以选择如何度过它。', author: '佚名' },
      { text: '成功的秘诀在于始终如一地坚持目标。', author: '佚名' },
      { text: '知识是人生旅途中最好的行囊。', author: '佚名' },
    ]
    
    const quote = quotes[Math.floor(Math.random() * quotes.length)]
    
    return {
      output: [
        '📖 今日名言',
        '',
        `"${quote.text}"`,
        '',
        `—— ${quote.author}`,
      ].join('\n')
    }
  },
  description: '显示随机名言',
  usage: 'quote',
  examples: ['quote']
})

registerCommand('timer', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const seconds = parseInt(args[0])
    
    if (isNaN(seconds) || seconds <= 0) {
      return {
        output: [
          '⏱️  倒计时器',
          '',
          '用法: timer <秒数>',
          '',
          '示例:',
          '  timer 60',
          '  timer 120',
        ].join('\n')
      }
    }
    
    let output = `⏱️  倒计时开始: ${seconds} 秒\n\n`
    
    for (let remaining = seconds; remaining > 0; remaining--) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (remaining <= 5) {
        output += `${remaining}... `
      }
    }
    
    output += '\n🎉 时间到！'
    
    return { output }
  },
  description: '倒计时器',
  usage: 'timer <秒数>',
  examples: ['timer 60', 'timer 120']
})

registerCommand('motd', {
  handler: (): CommandResult => {
    const hours = new Date().getHours()
    let greeting = ''
    
    if (hours < 6) greeting = '夜深了，注意休息 🌙'
    else if (hours < 12) greeting = '早上好！☀️'
    else if (hours < 14) greeting = '中午好！🌤️'
    else if (hours < 18) greeting = '下午好！🌥️'
    else greeting = '晚上好！🌙'
    
    const uptime = Math.floor(Math.random() * 100) + 10
    const users = Math.floor(Math.random() * 10) + 1
    
    return {
      output: [
        '========================================',
        '        WebLinuxOS 欢迎您！',
        '========================================',
        '',
        greeting,
        '',
        `系统运行时间: ${uptime} 小时`,
        `当前在线用户: ${users} 人`,
        '',
        '输入 `help` 查看可用命令',
        '输入 `apps` 查看所有应用',
        '',
        '========================================',
      ].join('\n')
    }
  },
  description: '显示欢迎信息',
  usage: 'motd',
  examples: ['motd']
})

registerCommand('help', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const commands: Record<string, { desc: string; usage: string }> = {
      'ls': { desc: '列出目录内容', usage: 'ls [路径]' },
      'cd': { desc: '切换目录', usage: 'cd <路径>' },
      'pwd': { desc: '显示当前目录', usage: 'pwd' },
      'mkdir': { desc: '创建目录', usage: 'mkdir <目录名>' },
      'rm': { desc: '删除文件或目录', usage: 'rm <路径>' },
      'cp': { desc: '复制文件', usage: 'cp <源> <目标>' },
      'mv': { desc: '移动/重命名文件', usage: 'mv <源> <目标>' },
      'cat': { desc: '查看文件内容', usage: 'cat <文件>' },
      'touch': { desc: '创建空文件', usage: 'touch <文件名>' },
      'echo': { desc: '输出文本', usage: 'echo <文本>' },
      'whoami': { desc: '显示当前用户', usage: 'whoami' },
      'date': { desc: '显示日期时间', usage: 'date' },
      'calc': { desc: '数学计算器', usage: 'calc <表达式>' },
      'weather': { desc: '查询天气', usage: 'weather [城市]' },
      'quote': { desc: '随机名言', usage: 'quote' },
      'password': { desc: '生成密码', usage: 'password [长度]' },
      'uuid': { desc: '生成UUID', usage: 'uuid' },
      'base64': { desc: 'Base64编码', usage: 'base64 <文本>' },
      'unbase64': { desc: 'Base64解码', usage: 'unbase64 <文本>' },
      'urlencode': { desc: 'URL编码', usage: 'urlencode <文本>' },
      'urldecode': { desc: 'URL解码', usage: 'urldecode <文本>' },
      'json': { desc: 'JSON格式化', usage: 'json <JSON>' },
      'hash': { desc: '计算哈希', usage: 'hash <文本>' },
      'rev': { desc: '反转文本', usage: 'rev <文本>' },
      'prime': { desc: '质数检测', usage: 'prime <数字>' },
      'factor': { desc: '质因数分解', usage: 'factor <数字>' },
      'roman': { desc: '罗马数字转换', usage: 'roman <数字>' },
      'timer': { desc: '倒计时器', usage: 'timer <秒数>' },
      'motd': { desc: '显示欢迎信息', usage: 'motd' },
      'apps': { desc: '列出所有应用', usage: 'apps' },
      'clear': { desc: '清空屏幕', usage: 'clear' },
      'help': { desc: '显示此帮助信息', usage: 'help [命令]' },
    }
    
    if (args.length > 0) {
      const cmd = args[0].toLowerCase()
      if (commands[cmd]) {
        return {
          output: [
            `命令: ${cmd}`,
            `描述: ${commands[cmd].desc}`,
            `用法: ${commands[cmd].usage}`,
          ].join('\n')
        }
      }
      return { output: `help: 未知命令 '${cmd}'` }
    }
    
    const output = ['📖 可用命令:', '', ...Object.entries(commands).map(([cmd, info]) => 
      `  ${cmd.padEnd(12)} - ${info.desc}`
    ), '', '使用 help <命令> 查看详细用法']
    
    return { output: output.join('\n') }
  },
  description: '显示帮助信息',
  usage: 'help [命令]',
  examples: ['help', 'help ls']
})