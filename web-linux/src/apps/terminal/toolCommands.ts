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