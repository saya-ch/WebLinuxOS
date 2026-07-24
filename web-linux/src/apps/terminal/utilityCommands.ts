import { registerCommand, COMMANDS } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath } from '../../store'

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
          '  calc sin(PI)',
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

async function computeHash(text: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

registerCommand('hash', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔑 哈希计算',
          '',
          '用法: hash <算法> <文本>',
          '',
          '支持的算法:',
          '  sha1   - SHA-1 哈希',
          '  sha256 - SHA-256 哈希（默认）',
          '  sha384 - SHA-384 哈希',
          '  sha512 - SHA-512 哈希',
          '',
          '示例:',
          '  hash sha256 password123',
          '  hash sha1 test',
          '',
          '💡 不指定算法时默认使用 SHA-256',
          '💡 浏览器 Web Crypto API 不支持 MD5，已从列表中移除',
        ].join('\n')
      }
    }

    let algorithm = 'SHA-256'
    let text = args.join(' ')

    const knownAlgorithms: Record<string, string> = {
      'sha1': 'SHA-1',
      'sha256': 'SHA-256',
      'sha384': 'SHA-384',
      'sha512': 'SHA-512',
    }

    const firstArg = args[0]?.toLowerCase() || ''
    if (firstArg && knownAlgorithms[firstArg]) {
      algorithm = knownAlgorithms[firstArg]
      text = args.slice(1).join(' ')
    } else if (firstArg === 'md5') {
      return {
        output: [
          '⚠️ MD5 不被支持',
          '',
          '浏览器 Web Crypto API 不实现 MD5 算法（出于安全考虑）。',
          '如需 MD5，可使用 Pyodide 运行 Python: python -c "import hashlib; print(hashlib.md5(b\\"text\\").hexdigest())"',
          '',
          '可选算法: sha1, sha256, sha384, sha512',
        ].join('\n')
      }
    }

    if (!text) {
      return { output: 'hash: 请提供要计算哈希的文本' }
    }

    try {
      const hash = await computeHash(text, algorithm)

      return {
        output: [
          `🔑 ${algorithm} 哈希`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `原文: ${text}`,
          `哈希: ${hash}`,
          `长度: ${hash.length} 字符`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ].join('\n')
      }
    } catch {
      return { output: `hash: 无法计算 ${algorithm} 哈希` }
    }
  },
  description: '计算文本哈希值（支持SHA1/SHA256/SHA384/SHA512）',
  usage: 'hash [算法] <文本>',
  examples: ['hash sha256 password123', 'hash sha1 test']
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

registerCommand('timer', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const seconds = parseInt(args[0])
    
    if (isNaN(seconds) || seconds <= 0 || seconds > 3600) {
      return {
        output: [
          '⏱️ 倒计时器',
          '',
          '用法: timer <秒数> (1-3600)',
          '',
          '示例:',
          '  timer 60',
          '  timer 300',
        ].join('\n')
      }
    }
    
    const startTime = Date.now()
    const endTime = startTime + seconds * 1000
    
    let output = `⏱️ 倒计时开始: ${seconds} 秒\n\n`
    
    while (Date.now() < endTime) {
      const remaining = Math.ceil((endTime - Date.now()) / 1000)
      if (remaining <= 5) {
        output += `${remaining}... `
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    output += '\n🎉 时间到！'
    
    return { output }
  },
  description: '倒计时器',
  usage: 'timer <秒数>',
  examples: ['timer 60', 'timer 300']
})

registerCommand('stopwatch', {
  handler: async (): Promise<CommandResult> => {
    const output = ['⏱️ 秒表已启动', '', '按 Ctrl+C 停止计时', '', '秒表运行中...']
    return { output: output.join('\n') }
  },
  description: '启动秒表',
  usage: 'stopwatch',
  examples: ['stopwatch']
})

registerCommand('calendar', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const now = new Date()
    const year = args.length > 0 ? parseInt(args[0]) : now.getFullYear()
    const month = args.length > 1 ? parseInt(args[1]) - 1 : now.getMonth()
    
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return {
        output: [
          '📅 日历',
          '',
          '用法: calendar [年份] [月份]',
          '',
          '示例:',
          '  calendar',
          '  calendar 2024',
          '  calendar 2024 12',
        ].join('\n')
      }
    }
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = now.getDate()
    
    const output: string[] = []
    output.push(`        ${monthNames[month]} ${year}`)
    output.push('   ' + weekDays.map(d => d.padEnd(4)).join(''))
    output.push(''.padEnd(30, '-'))
    
    let line = '   '
    for (let i = 0; i < firstDay; i++) {
      line += '    '
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = year === now.getFullYear() && month === now.getMonth() && day === today
      const dayStr = isToday ? `\x1b[32m${day.toString().padStart(2)}\x1b[0m` : day.toString().padStart(2)
      line += dayStr + '  '
      
      if ((firstDay + day) % 7 === 0) {
        output.push(line)
        line = '   '
      }
    }
    
    if (line.trim()) {
      output.push(line)
    }
    
    output.push('')
    output.push('提示: 高亮显示的是今天')
    
    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'calendar [年份] [月份]',
  examples: ['calendar', 'calendar 2024', 'calendar 2024 12']
})

registerCommand('cron', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const expression = args.join(' ')
    
    if (!expression) {
      return {
        output: [
          '⏰ Cron表达式解析器',
          '',
          '用法: cron <表达式>',
          '',
          '格式: 分 时 日 月 周',
          '',
          '示例:',
          '  cron "0 9 * * 1-5"',
          '  cron "*/30 * * * *"',
          '  cron "0 0 1 * *"',
        ].join('\n')
      }
    }
    
    const parts = expression.trim().split(/\s+/)
    if (parts.length !== 5) {
      return { output: '错误: Cron表达式必须包含5个字段' }
    }
    
    const [minute, hour, day, month, weekday] = parts
    
    const parseField = (field: string, label: string): string => {
      if (field === '*') return `每${label}`
      if (field.startsWith('*/')) {
        const interval = parseInt(field.slice(2))
        return `每${interval}${label}`
      }
      if (field.includes('-')) {
        const [start, end] = field.split('-')
        return `${start}-${end}${label}`
      }
      if (field.includes(',')) {
        return `指定: ${field}${label}`
      }
      return `${field}${label}`
    }
    
    const output = [
      '⏰ Cron表达式解析',
      '',
      `表达式: ${expression}`,
      '',
      '解析结果:',
      `  分钟: ${parseField(minute, '分钟')}`,
      `  小时: ${parseField(hour, '小时')}`,
      `  日期: ${parseField(day, '日')}`,
      `  月份: ${parseField(month, '月')}`,
      `  星期: ${parseField(weekday, '周')}`,
      '',
      '提示: 周几 0/7 表示周日',
    ].join('\n')
    
    return { output }
  },
  description: 'Cron表达式解析',
  usage: 'cron <表达式>',
  examples: ['cron "0 9 * * 1-5"', 'cron "*/30 * * * *"']
})

registerCommand('password-strength', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const password = args.join(' ')
    
    if (!password) {
      return {
        output: [
          '🔐 密码强度检测',
          '',
          '用法: password-strength <密码>',
          '',
          '示例:',
          '  password-strength mypassword123',
          '  password-strength P@ssw0rd!',
        ].join('\n')
      }
    }
    
    let score = 0
    
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
    
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 2
    
    const strength = score <= 2 ? '弱' : score <= 4 ? '中等' : score <= 6 ? '强' : '非常强'
    const color = score <= 2 ? '\x1b[31m' : score <= 4 ? '\x1b[33m' : score <= 6 ? '\x1b[36m' : '\x1b[32m'
    
    const recommendations: string[] = []
    if (password.length < 8) recommendations.push('密码长度至少8个字符')
    if (!/[a-z]/.test(password)) recommendations.push('添加小写字母')
    if (!/[A-Z]/.test(password)) recommendations.push('添加大写字母')
    if (!/[0-9]/.test(password)) recommendations.push('添加数字')
    if (!/[^a-zA-Z0-9]/.test(password)) recommendations.push('添加特殊字符')
    
    const output = [
      '🔐 密码强度检测',
      '',
      `密码长度: ${password.length} 字符`,
      `强度评分: ${score}/8`,
      `强度等级: ${color}${strength}\x1b[0m`,
      '',
    ]
    
    if (recommendations.length > 0) {
      output.push('建议:')
      recommendations.forEach(r => output.push(`  • ${r}`))
    } else {
      output.push('✅ 密码强度良好！')
    }
    
    return { output: output.join('\n') }
  },
  description: '检测密码强度',
  usage: 'password-strength <密码>',
  examples: ['password-strength mypassword', 'password-strength P@ssw0rd!']
})

registerCommand('converter', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 3) {
      return {
        output: [
          '🔄 单位转换器',
          '',
          '用法: converter <数值> <源单位> <目标单位>',
          '',
          '支持的单位:',
          '',
          '长度:',
          '  m, cm, mm, km, in, ft, yd, mi',
          '',
          '重量:',
          '  kg, g, mg, lb, oz',
          '',
          '温度:',
          '  c (摄氏度), f (华氏度), k (开尔文)',
          '',
          '数据:',
          '  b, kb, mb, gb, tb',
          '',
          '示例:',
          '  converter 100 km mi',
          '  converter 32 c f',
          '  converter 1 gb mb',
        ].join('\n')
      }
    }
    
    const value = parseFloat(args[0])
    const from = args[1].toLowerCase()
    const to = args[2].toLowerCase()
    
    if (isNaN(value)) {
      return { output: '错误: 无效的数值' }
    }
    
    const conversionRates: Record<string, Record<string, number>> = {
      m: { cm: 100, mm: 1000, km: 0.001, in: 39.3701, ft: 3.28084, yd: 1.09361, mi: 0.000621371 },
      cm: { m: 0.01, mm: 10, km: 0.00001, in: 0.393701, ft: 0.0328084, yd: 0.0109361, mi: 0.00000621371 },
      mm: { m: 0.001, cm: 0.1, km: 0.000001, in: 0.0393701, ft: 0.00328084, yd: 0.00109361, mi: 0.000000621371 },
      km: { m: 1000, cm: 100000, mm: 1000000, in: 39370.1, ft: 3280.84, yd: 1093.61, mi: 0.621371 },
      in: { m: 0.0254, cm: 2.54, mm: 25.4, km: 0.0000254, ft: 0.0833333, yd: 0.0277778, mi: 0.0000157828 },
      ft: { m: 0.3048, cm: 30.48, mm: 304.8, km: 0.0003048, in: 12, yd: 0.333333, mi: 0.000189394 },
      yd: { m: 0.9144, cm: 91.44, mm: 914.4, km: 0.0009144, in: 36, ft: 3, mi: 0.000568182 },
      mi: { m: 1609.34, cm: 160934, mm: 1609344, km: 1.60934, in: 63360, ft: 5280, yd: 1760 },
      kg: { g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274 },
      g: { kg: 0.001, mg: 1000, lb: 0.00220462, oz: 0.035274 },
      mg: { kg: 0.000001, g: 0.001, lb: 0.00000220462, oz: 0.000035274 },
      lb: { kg: 0.453592, g: 453.592, mg: 453592, oz: 16 },
      oz: { kg: 0.0283495, g: 28.3495, mg: 28349.5, lb: 0.0625 },
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
    } else if (conversionRates[from] && conversionRates[from][to]) {
      result = value * conversionRates[from][to]
    } else {
      return { output: `不支持的转换: ${from} -> ${to}` }
    }
    
    const formattedResult = result.toFixed(6).replace(/\.?0+$/, '')
    
    return {
      output: [
        '🔄 单位转换结果',
        '',
        `${value} ${from} = ${formattedResult} ${to}`,
      ].join('\n')
    }
  },
  description: '单位转换器',
  usage: 'converter <数值> <源单位> <目标单位>',
  examples: ['converter 100 km mi', 'converter 32 c f', 'converter 1 gb mb']
})

registerCommand('jwt-decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const token = args.join(' ')
    
    if (!token) {
      return {
        output: [
          '🔐 JWT解码',
          '',
          '用法: jwt-decode <JWT令牌>',
          '',
          '示例:',
          '  jwt-decode eyJhbGciOiJIUzI1NiIs...',
        ].join('\n')
      }
    }
    
    try {
      const parts = token.split('.')
      
      if (parts.length !== 3) {
        return { output: '无效的JWT令牌格式' }
      }
      
      const decodeBase64 = (str: string): string => {
        const padded = str.padEnd(str.length + (4 - str.length % 4) % 4, '=')
        return atob(padded)
      }
      
      const header = JSON.parse(decodeBase64(parts[0]))
      const payload = JSON.parse(decodeBase64(parts[1]))
      
      return {
        output: [
          '🔐 JWT令牌解析',
          '',
          '【Header】',
          JSON.stringify(header, null, 2),
          '',
          '【Payload】',
          JSON.stringify(payload, null, 2),
          '',
          '【Signature】',
          parts[2],
          '',
          '提示: 此工具仅解码JWT内容，不验证签名',
        ].join('\n')
      }
    } catch (e) {
      return { output: `JWT解码错误: ${(e as Error).message}` }
    }
  },
  description: '解码JWT令牌',
  usage: 'jwt-decode <令牌>',
  examples: ['jwt-decode eyJhbGciOiJIUzI1NiIs']
})

registerCommand('regex-test', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔍 正则表达式测试',
          '',
          '用法: regex-test <模式> <文本>',
          '',
          '示例:',
          '  regex-test "\\d+" "abc123def"',
          '  regex-test "[a-z]+" "Hello World"',
        ].join('\n')
      }
    }
    
    const pattern = args[0]
    const text = args.slice(1).join(' ')
    
    try {
      const regex = new RegExp(pattern)
      const matches = text.match(regex)
      const allMatches = text.match(new RegExp(pattern, 'g')) || []
      
      const output = [
        '🔍 正则表达式测试',
        '',
        `模式: ${pattern}`,
        `文本: ${text}`,
        '',
        `匹配结果: ${matches ? '✅ 匹配' : '❌ 不匹配'}`,
      ]
      
      if (allMatches.length > 0) {
        output.push('')
        output.push('匹配项:')
        allMatches.forEach((match, index) => {
          output.push(`  ${index + 1}. "${match}"`)
        })
      }
      
      return { output: output.join('\n') }
    } catch (e) {
      return { output: `正则表达式错误: ${(e as Error).message}` }
    }
  },
  description: '测试正则表达式',
  usage: 'regex-test <模式> <文本>',
  examples: ['regex-test "\\d+" "abc123"']
})

registerCommand('url-info', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const url = args.join(' ')
    
    if (!url) {
      return {
        output: [
          '🔗 URL信息解析',
          '',
          '用法: url-info <URL>',
          '',
          '示例:',
          '  url-info https://example.com/path?query=1',
        ].join('\n')
      }
    }
    
    try {
      const parsed = new URL(url)
      
      const output = [
        '🔗 URL信息',
        '',
        `完整URL: ${parsed.href}`,
        `协议: ${parsed.protocol}`,
        `主机: ${parsed.host}`,
        `域名: ${parsed.hostname}`,
        `端口: ${parsed.port || '默认'}`,
        `路径: ${parsed.pathname}`,
        `查询参数: ${parsed.search || '无'}`,
        `片段: ${parsed.hash || '无'}`,
      ]
      
      if (parsed.searchParams.size > 0) {
        output.push('')
        output.push('查询参数详情:')
        parsed.searchParams.forEach((value, key) => {
          output.push(`  ${key}: ${value}`)
        })
      }
      
      return { output: output.join('\n') }
    } catch (e) {
      return { output: `URL解析错误: ${(e as Error).message}` }
    }
  },
  description: '解析URL信息',
  usage: 'url-info <URL>',
  examples: ['url-info https://example.com/path']
})

registerCommand('file-type', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const filename = args[0]
    
    if (!filename) {
      return {
        output: [
          '📁 文件类型检测',
          '',
          '用法: file-type <文件名>',
          '',
          '示例:',
          '  file-type document.pdf',
          '  file-type image.png',
        ].join('\n')
      }
    }
    
    const extension = filename.split('.').pop()?.toLowerCase() || ''
    
    const fileTypes: Record<string, { type: string; mime: string }> = {
      txt: { type: '纯文本文件', mime: 'text/plain' },
      md: { type: 'Markdown文件', mime: 'text/markdown' },
      html: { type: 'HTML文件', mime: 'text/html' },
      css: { type: 'CSS样式文件', mime: 'text/css' },
      js: { type: 'JavaScript文件', mime: 'application/javascript' },
      ts: { type: 'TypeScript文件', mime: 'application/typescript' },
      json: { type: 'JSON数据文件', mime: 'application/json' },
      xml: { type: 'XML文件', mime: 'application/xml' },
      yaml: { type: 'YAML配置文件', mime: 'text/yaml' },
      yml: { type: 'YAML配置文件', mime: 'text/yaml' },
      pdf: { type: 'PDF文档', mime: 'application/pdf' },
      jpg: { type: 'JPEG图片', mime: 'image/jpeg' },
      jpeg: { type: 'JPEG图片', mime: 'image/jpeg' },
      png: { type: 'PNG图片', mime: 'image/png' },
      gif: { type: 'GIF动画', mime: 'image/gif' },
      svg: { type: 'SVG矢量图', mime: 'image/svg+xml' },
      webp: { type: 'WebP图片', mime: 'image/webp' },
      mp4: { type: 'MP4视频', mime: 'video/mp4' },
      mp3: { type: 'MP3音频', mime: 'audio/mpeg' },
      zip: { type: 'ZIP压缩包', mime: 'application/zip' },
      tar: { type: 'TAR归档', mime: 'application/x-tar' },
      gz: { type: 'GZIP压缩', mime: 'application/gzip' },
      sh: { type: 'Shell脚本', mime: 'application/x-shellscript' },
      py: { type: 'Python脚本', mime: 'text/x-python' },
    }
    
    const info = fileTypes[extension]
    
    if (info) {
      return {
        output: [
          '📁 文件类型检测',
          '',
          `文件名: ${filename}`,
          `扩展名: .${extension}`,
          `文件类型: ${info.type}`,
          `MIME类型: ${info.mime}`,
        ].join('\n')
      }
    }
    
    return {
      output: [
        '📁 文件类型检测',
        '',
        `文件名: ${filename}`,
        `扩展名: .${extension}`,
        `文件类型: 未知类型`,
        `MIME类型: application/octet-stream`,
      ].join('\n')
    }
  },
  description: '检测文件类型',
  usage: 'file-type <文件名>',
  examples: ['file-type document.pdf', 'file-type image.png']
})

registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const now = Date.now()
      const date = new Date()
      
      return {
        output: [
          '⏱️ 当前时间戳',
          '',
          `Unix时间戳: ${now}`,
          `日期时间: ${date.toLocaleString('zh-CN')}`,
          `ISO格式: ${date.toISOString()}`,
        ].join('\n')
      }
    }
    
    const timestamp = parseInt(args[0])
    
    if (isNaN(timestamp)) {
      return { output: '错误: 无效的时间戳' }
    }
    
    const date = new Date(timestamp * 1000)
    
    return {
      output: [
        '⏱️ 时间戳转换',
        '',
        `Unix时间戳: ${timestamp}`,
        `日期时间: ${date.toLocaleString('zh-CN')}`,
        `ISO格式: ${date.toISOString()}`,
      ].join('\n')
    }
  },
  description: '显示或转换Unix时间戳',
  usage: 'timestamp [时间戳]',
  examples: ['timestamp', 'timestamp 1672531200']
})

registerCommand('base-convert', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 3) {
      return {
        output: [
          '🔢 进制转换器',
          '',
          '用法: base-convert <数值> <源进制> <目标进制>',
          '',
          '支持进制: 2-36',
          '',
          '示例:',
          '  base-convert 10 10 2',
          '  base-convert FF 16 10',
          '  base-convert 1010 2 16',
        ].join('\n')
      }
    }
    
    const value = args[0]
    const fromBase = parseInt(args[1])
    const toBase = parseInt(args[2])
    
    if (isNaN(fromBase) || isNaN(toBase) || fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
      return { output: '错误: 进制必须在2-36之间' }
    }
    
    try {
      const decimal = parseInt(value, fromBase)
      const result = decimal.toString(toBase).toUpperCase()
      
      return {
        output: [
          '🔢 进制转换',
          '',
          `${value} (${fromBase}进制) = ${result} (${toBase}进制)`,
        ].join('\n')
      }
    } catch {
      return { output: '错误: 无效的数值或进制' }
    }
  },
  description: '进制转换器',
  usage: 'base-convert <数值> <源进制> <目标进制>',
  examples: ['base-convert 10 10 2', 'base-convert FF 16 10']
})

registerCommand('http-status', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const statusCode = parseInt(args[0])
    
    if (isNaN(statusCode)) {
      return {
        output: [
          '🌐 HTTP状态码查询',
          '',
          '用法: http-status <状态码>',
          '',
          '示例:',
          '  http-status 404',
          '  http-status 500',
          '',
          '常用状态码:',
          '  1xx - 信息性响应',
          '  2xx - 成功响应',
          '  3xx - 重定向',
          '  4xx - 客户端错误',
          '  5xx - 服务器错误',
        ].join('\n')
      }
    }
    
    const statusCodes: Record<number, { message: string; description: string }> = {
      100: { message: 'Continue', description: '服务器已收到请求的一部分，等待剩余部分' },
      101: { message: 'Switching Protocols', description: '服务器将切换协议' },
      200: { message: 'OK', description: '请求成功' },
      201: { message: 'Created', description: '请求成功且服务器创建了新的资源' },
      202: { message: 'Accepted', description: '服务器已接受请求，但尚未处理完成' },
      204: { message: 'No Content', description: '服务器成功处理了请求，但没有返回任何内容' },
      301: { message: 'Moved Permanently', description: '请求的资源已永久移动到新位置' },
      302: { message: 'Found', description: '请求的资源临时移动到新位置' },
      304: { message: 'Not Modified', description: '资源未修改，使用缓存版本' },
      400: { message: 'Bad Request', description: '服务器无法理解请求' },
      401: { message: 'Unauthorized', description: '请求需要身份验证' },
      403: { message: 'Forbidden', description: '服务器拒绝请求' },
      404: { message: 'Not Found', description: '请求的资源未找到' },
      405: { message: 'Method Not Allowed', description: '请求方法不被允许' },
      408: { message: 'Request Timeout', description: '请求超时' },
      409: { message: 'Conflict', description: '请求与服务器状态冲突' },
      500: { message: 'Internal Server Error', description: '服务器内部错误' },
      501: { message: 'Not Implemented', description: '服务器不支持请求的功能' },
      502: { message: 'Bad Gateway', description: '网关错误' },
      503: { message: 'Service Unavailable', description: '服务器暂时无法处理请求' },
      504: { message: 'Gateway Timeout', description: '网关超时' },
    }
    
    const info = statusCodes[statusCode]
    
    if (info) {
      return {
        output: [
          '🌐 HTTP状态码',
          '',
          `${statusCode} ${info.message}`,
          '',
          info.description,
        ].join('\n')
      }
    }
    
    const category = Math.floor(statusCode / 100)
    const categories: Record<number, string> = {
      1: '信息性响应',
      2: '成功响应',
      3: '重定向',
      4: '客户端错误',
      5: '服务器错误',
    }
    
    return {
      output: [
        '🌐 HTTP状态码',
        '',
        `${statusCode} - ${categories[category] || '未知类别'}`,
        '',
        '详细描述: 未找到该状态码的详细信息',
      ].join('\n')
    }
  },
  description: '查询HTTP状态码',
  usage: 'http-status <状态码>',
  examples: ['http-status 404', 'http-status 500']
})

registerCommand('clear', {
  handler: (): CommandResult => {
    return { output: '\u001b[2J\u001b[0;0H' }
  },
  description: '清屏',
  usage: 'clear',
  examples: ['clear']
})

registerCommand('echo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    return { output: args.join(' ') }
  },
  description: '输出文本',
  usage: 'echo <文本>',
  examples: ['echo Hello World', 'echo $PATH']
})

registerCommand('du', {
  handler: (context: CommandContext): CommandResult => {
    const { cwd, files } = context
    const targetDir = findNodeByPath(files, cwd)
    
    if (!targetDir || targetDir.type !== 'folder') {
      return { output: `目录 ${cwd} 不存在` }
    }
    
    const countFiles = (node: typeof targetDir): { count: number; size: number } => {
      if (node.type === 'file') {
        return { count: 1, size: (node.content?.length || 0) }
      }
      if (node.type === 'folder' && node.children) {
        return node.children.reduce((acc, child) => {
          const result = countFiles(child)
          return {
            count: acc.count + result.count,
            size: acc.size + result.size
          }
        }, { count: 0, size: 0 })
      }
      return { count: 0, size: 0 }
    }
    
    const stats = countFiles(targetDir)
    
    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }
    
    const output: string[] = []
    output.push(`目录: ${cwd}`)
    output.push('═'.repeat(50))
    output.push(`文件数量: ${stats.count}`)
    output.push(`总大小: ${formatSize(stats.size)}`)
    
    return { output: output.join('\n') }
  },
  description: '显示目录大小',
  usage: 'du',
  examples: ['du']
})

registerCommand('help', {
  handler: (): CommandResult => {
    const commands = Object.entries(COMMANDS)
      .map(([name, def]) => ({ name, ...def }))
      .sort((a, b) => a.name.localeCompare(b.name))
    
    const output: string[] = []
    output.push('📖 WebLinuxOS 命令列表')
    output.push('')
    output.push('═'.repeat(80))
    output.push(`命令名称${' '.repeat(20)}描述`)
    output.push('─'.repeat(80))
    
    commands.forEach(cmd => {
      const name = cmd.name.padEnd(22)
      const desc = cmd.description
      output.push(`${name}${desc}`)
    })
    
    output.push('')
    output.push('═'.repeat(80))
    output.push('提示: 使用 <命令> --help 或 <命令> -h 查看详细用法')
    output.push('示例: weather --help')
    
    return { output: output.join('\n') }
  },
  description: '显示所有可用命令',
  usage: 'help',
  examples: ['help']
})

// whoami, hostname, env, which 命令已在 systemCommands.ts 中注册
// 此处不再重复注册，避免简化版覆盖完整版造成功能丢失

registerCommand('history', {
  handler: (): CommandResult => {
    return {
      output: [
        '📜 命令历史',
        '',
        '此功能需要终端支持命令历史记录',
        '',
        '使用方向键 ↑↓ 浏览历史命令',
        '使用 Ctrl+R 搜索历史命令',
      ].join('\n')
    }
  },
  description: '显示命令历史',
  usage: 'history',
  examples: ['history']
})

registerCommand('reboot', {
  handler: (): CommandResult => {
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
    return {
      output: [
        '🔄 正在重启系统...',
        '',
        '系统将在 1 秒后重新加载',
      ].join('\n')
    }
  },
  description: '重启系统',
  usage: 'reboot',
  examples: ['reboot']
})

registerCommand('shutdown', {
  handler: (): CommandResult => {
    return {
      output: [
        '⏹️ 系统关机',
        '',
        'WebLinuxOS 是一个 Web 应用，无法真正关机。',
        '您可以关闭浏览器标签页来退出。',
        '',
        '提示: 输入 reboot 重新加载系统',
      ].join('\n')
    }
  },
  description: '关闭系统',
  usage: 'shutdown',
  examples: ['shutdown']
})

registerCommand('sleep', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const seconds = parseInt(args[0]) || 1
    
    if (seconds < 1 || seconds > 60) {
      return {
        output: [
          '😴 sleep - 延迟执行',
          '',
          '用法: sleep <秒数> (1-60)',
          '',
          '示例:',
          '  sleep 5',
          '  sleep 10',
        ].join('\n')
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, seconds * 1000))
    
    return { output: '' }
  },
  description: '延迟执行指定秒数',
  usage: 'sleep <秒数>',
  examples: ['sleep 5', 'sleep 10']
})

registerCommand('seq', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔢 seq - 生成数字序列',
          '',
          '用法: seq <起始> <结束> [步长]',
          '',
          '示例:',
          '  seq 1 10',
          '  seq 0 20 2',
          '  seq 10 1',
        ].join('\n')
      }
    }
    
    const start = parseInt(args[0]) || 1
    const end = parseInt(args[1]) || 10
    const step = args.length > 2 ? parseInt(args[2]) : (start < end ? 1 : -1)
    
    if (isNaN(start) || isNaN(end) || isNaN(step)) {
      return { output: '错误: 无效的参数' }
    }
    
    const numbers: number[] = []
    if (step > 0) {
      for (let i = start; i <= end; i += step) {
        numbers.push(i)
      }
    } else {
      for (let i = start; i >= end; i += step) {
        numbers.push(i)
      }
    }
    
    return { output: numbers.join('\n') }
  },
  description: '生成数字序列',
  usage: 'seq <起始> <结束> [步长]',
  examples: ['seq 1 10', 'seq 0 20 2']
})

// 注意：head / tail / wc 命令的文件感知实现位于 fileCommands.ts
// （支持 head -n 5 file.txt、tail -20 log.txt、wc file.txt 等用法）
// 此处不再重复注册，避免简化版覆盖文件感知版造成功能丢失。
// sort / uniq 命令的文件感知实现位于 toolCommands.ts，同样不再重复注册。