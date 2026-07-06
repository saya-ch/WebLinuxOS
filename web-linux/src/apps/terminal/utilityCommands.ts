import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

function evaluateExpression(expr: string): number {
  let pos = 0
  
  function skipWhitespace() {
    while (pos < expr.length && /\s/.test(expr[pos])) pos++
  }
  
  function peek(): string {
    skipWhitespace()
    return expr[pos] || ''
  }
  
  function consume(expected?: string): string {
    skipWhitespace()
    if (expected && expr[pos] !== expected) {
      throw new Error(`期望 "${expected}" 在位置 ${pos}`)
    }
    return expr[pos++] || ''
  }
  
  function parseNumber(): number {
    skipWhitespace()
    const start = pos
    while (pos < expr.length && /[0-9.]/.test(expr[pos])) pos++
    if (start === pos) throw new Error(`在位置 ${pos} 处期望数字`)
    const num = parseFloat(expr.slice(start, pos))
    if (isNaN(num)) throw new Error('无效数字')
    return num
  }
  
  function parseAtom(): number {
    skipWhitespace()
    const ch = peek()
    
    if (ch === '(') {
      consume('(')
      const val = parseExpression()
      consume(')')
      return val
    }
    
    if (ch === '-') {
      consume('-')
      return -parseAtom()
    }
    
    if (ch === '+') {
      consume('+')
      return parseAtom()
    }
    
    if (/[a-zA-Z]/.test(ch)) {
      const start = pos
      while (pos < expr.length && /[a-zA-Z0-9]/.test(expr[pos])) pos++
      const name = expr.slice(start, pos)
      
      const constants: Record<string, number> = {
        'PI': Math.PI,
        'pi': Math.PI,
        'E': Math.E,
        'e': Math.E,
      }
      
      if (name in constants) {
        return constants[name]
      }
      
      const functions: Record<string, (n: number) => number> = {
        'sqrt': Math.sqrt,
        'sin': Math.sin,
        'cos': Math.cos,
        'tan': Math.tan,
        'asin': Math.asin,
        'acos': Math.acos,
        'atan': Math.atan,
        'log': Math.log10,
        'ln': Math.log,
        'abs': Math.abs,
        'floor': Math.floor,
        'ceil': Math.ceil,
        'round': Math.round,
        'exp': Math.exp,
      }
      
      if (name in functions) {
        consume('(')
        const arg = parseExpression()
        consume(')')
        return functions[name](arg)
      }
      
      throw new Error(`未知标识符: ${name}`)
    }
    
    return parseNumber()
  }
  
  function parsePower(): number {
    let base = parseAtom()
    while (peek() === '^') {
      consume('^')
      const exponent = parsePower()
      base = Math.pow(base, exponent)
    }
    return base
  }
  
  function parseFactor(): number {
    let result = parsePower()
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume()
      const right = parsePower()
      if (op === '*') result *= right
      else if (op === '/') {
        if (right === 0) throw new Error('除以零')
        result /= right
      }
      else result %= right
    }
    return result
  }
  
  function parseTerm(): number {
    let result = parseFactor()
    while (peek() === '+' || peek() === '-') {
      const op = consume()
      const right = parseFactor()
      if (op === '+') result += right
      else result -= right
    }
    return result
  }
  
  function parseExpression(): number {
    return parseTerm()
  }
  
  const result = parseExpression()
  skipWhitespace()
  if (pos < expr.length) {
    throw new Error(`位置 ${pos} 处有意外字符`)
  }
  return result
}

registerCommand('calc', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    if (args.length === 0) {
      return {
        output: [
          '🧮 计算器',
          '═'.repeat(40),
          '',
          '用法: calc <表达式>',
          '',
          '支持的运算:',
          '  + - * / % ^     基本运算',
          '  sin cos tan     三角函数',
          '  asin acos atan  反三角函数',
          '  sqrt log ln exp 数学函数',
          '  abs floor ceil round',
          '  PI E            常量',
          '  ( )             括号',
          '',
          '示例:',
          '  calc 2+3*4',
          '  calc "sqrt(16) + sin(PI/2)"',
          '  calc "10 % 3"',
          '  calc "2^10"',
          '',
        ].join('\n')
      }
    }

    const expr = args.join(' ').trim()
    
    try {
      const result = evaluateExpression(expr)
      
      return {
        output: [
          '🧮 计算结果',
          '═'.repeat(40),
          '',
          `表达式: ${expr}`,
          '',
          `结果: \x1b[1;32m${result}\x1b[0m`,
          '',
        ].join('\n')
      }
    } catch (error) {
      return { output: `计算错误: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '命令行计算器',
  usage: 'calc <表达式>',
  examples: ['calc 2+3*4', 'calc sqrt(16)', 'calc "sin(PI/2)"']
})

registerCommand('age', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    if (args.length === 0) {
      return {
        output: [
          '🎂 年龄计算器',
          '═'.repeat(40),
          '',
          '用法: age <出生日期> [格式]',
          '',
          '格式: YYYY-MM-DD 或 YYYY/MM/DD',
          '',
          '示例:',
          '  age 1990-01-15',
          '  age 2000/12/25',
          '',
        ].join('\n')
      }
    }

    const birthStr = args[0].replace(/\//g, '-')
    const birthDate = new Date(birthStr)
    
    if (isNaN(birthDate.getTime())) {
      return { output: '错误: 无效的日期格式，请使用 YYYY-MM-DD' }
    }

    const now = new Date()
    if (birthDate > now) {
      return { output: '错误: 出生日期不能晚于今天' }
    }

    let years = now.getFullYear() - birthDate.getFullYear()
    let months = now.getMonth() - birthDate.getMonth()
    let days = now.getDate() - birthDate.getDate()

    if (days < 0) {
      months--
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      days += lastMonth.getDate()
    }
    if (months < 0) {
      years--
      months += 12
    }

    const totalDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalWeeks = Math.floor(totalDays / 7)
    const totalHours = totalDays * 24
    
    const nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate())
    if (nextBirthday < now) {
      nextBirthday.setFullYear(now.getFullYear() + 1)
    }
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const output: string[] = []
    output.push('🎂 年龄计算')
    output.push('═'.repeat(40))
    output.push('')
    output.push(`出生日期: ${birthDate.toLocaleDateString('zh-CN')}`)
    output.push(`当前年龄: ${years} 岁 ${months} 个月 ${days} 天`)
    output.push('')
    output.push('【详细数据】')
    output.push(`  总天数: ${totalDays.toLocaleString()} 天`)
    output.push(`  总周数: ${totalWeeks.toLocaleString()} 周`)
    output.push(`  总小时: ${totalHours.toLocaleString()} 小时`)
    output.push('')
    output.push(`下次生日还有: ${daysUntilBirthday} 天`)
    output.push('')

    return { output: output.join('\n') }
  },
  description: '计算年龄和生日倒计时',
  usage: 'age <出生日期>',
  examples: ['age 1990-01-15', 'age 2000/12/25']
})

registerCommand('base64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔐 Base64 编解码',
          '═'.repeat(40),
          '',
          '用法: base64 <encode|decode> <文本>',
          '',
          '示例:',
          '  base64 encode Hello World',
          '  base64 decode SGVsbG8=',
          '',
        ].join('\n')
      }
    }

    const mode = args[0]
    const text = args.slice(1).join(' ')

    try {
      if (mode === 'encode' || mode === 'enc') {
        const encoded = btoa(unescape(encodeURIComponent(text)))
        return {
          output: [
            '🔐 Base64 编码',
            '═'.repeat(40),
            '',
            `原文: ${text}`,
            '',
            `结果: \x1b[32m${encoded}\x1b[0m`,
            '',
          ].join('\n')
        }
      } else if (mode === 'decode' || mode === 'dec') {
        const decoded = decodeURIComponent(escape(atob(text)))
        return {
          output: [
            '🔐 Base64 解码',
            '═'.repeat(40),
            '',
            `编码: ${text}`,
            '',
            `结果: \x1b[32m${decoded}\x1b[0m`,
            '',
          ].join('\n')
        }
      } else {
        return { output: '错误: 模式必须是 encode 或 decode' }
      }
    } catch (error) {
      return { output: `错误: ${error instanceof Error ? error.message : '操作失败'}` }
    }
  },
  description: 'Base64 编码/解码',
  usage: 'base64 <encode|decode> <文本>',
  examples: ['base64 encode Hello', 'base64 decode SGVsbG8=']
})

registerCommand('urlencode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🌐 URL 编解码',
          '═'.repeat(40),
          '',
          '用法: urlencode <encode|decode> <文本>',
          '',
          '示例:',
          '  urlencode encode hello world',
          '  urlencode decode hello%20world',
          '',
        ].join('\n')
      }
    }

    const mode = args[0]
    const text = args.slice(1).join(' ')

    try {
      if (mode === 'encode' || mode === 'enc') {
        const encoded = encodeURIComponent(text)
        return {
          output: [
            '🌐 URL 编码',
            '═'.repeat(40),
            '',
            `原文: ${text}`,
            '',
            `结果: \x1b[32m${encoded}\x1b[0m`,
            '',
          ].join('\n')
        }
      } else if (mode === 'decode' || mode === 'dec') {
        const decoded = decodeURIComponent(text)
        return {
          output: [
            '🌐 URL 解码',
            '═'.repeat(40),
            '',
            `编码: ${text}`,
            '',
            `结果: \x1b[32m${decoded}\x1b[0m`,
            '',
          ].join('\n')
        }
      } else {
        return { output: '错误: 模式必须是 encode 或 decode' }
      }
    } catch (error) {
      return { output: `错误: ${error instanceof Error ? error.message : '操作失败'}` }
    }
  },
  description: 'URL 编码/解码',
  usage: 'urlencode <encode|decode> <文本>',
  examples: ['urlencode encode hello world']
})

registerCommand('uuid', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = parseInt(args[0]) || 1
    
    if (count > 100) {
      return { output: '错误: 最多生成 100 个 UUID' }
    }

    const uuids: string[] = []
    for (let i = 0; i < count; i++) {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      uuids.push(`${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`)
    }

    const output: string[] = []
    output.push('🆔 UUID 生成器 (v4)')
    output.push('═'.repeat(40))
    output.push('')
    uuids.forEach((uuid, i) => {
      output.push(count > 1 ? `${i + 1}. ${uuid}` : uuid)
    })
    output.push('')
    output.push(`共生成 ${count} 个 UUID`)

    return { output: output.join('\n') }
  },
  description: '生成 UUID v4',
  usage: 'uuid [数量]',
  examples: ['uuid', 'uuid 5']
})

registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const now = Math.floor(Date.now() / 1000)
      return {
        output: [
          '⏰ 时间戳',
          '═'.repeat(40),
          '',
          `当前时间戳: \x1b[32m${now}\x1b[0m (秒)`,
          `当前时间戳: ${Date.now()} (毫秒)`,
          '',
          `当前时间: ${new Date().toLocaleString('zh-CN')}`,
          '',
        ].join('\n')
      }
    }

    const ts = parseInt(args[0])
    if (isNaN(ts)) {
      return { output: '错误: 请输入有效的时间戳' }
    }

    let date: Date
    if (ts > 9999999999) {
      date = new Date(ts)
    } else {
      date = new Date(ts * 1000)
    }

    return {
      output: [
        '⏰ 时间戳转换',
        '═'.repeat(40),
        '',
        `时间戳: ${ts}`,
        '',
        `北京时间: ${date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
        `UTC 时间: ${date.toUTCString()}`,
        '',
      ].join('\n')
    }
  },
  description: '时间戳转换',
  usage: 'timestamp [时间戳]',
  examples: ['timestamp', 'timestamp 1700000000']
})

registerCommand('password', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const length = parseInt(args[0]) || 16
    
    if (length < 4 || length > 128) {
      return { output: '错误: 密码长度必须在 4-128 之间' }
    }

    const hasNumbers = !args.includes('--no-nums')
    const hasSymbols = !args.includes('--no-symbols')
    const hasUpper = !args.includes('--no-upper')
    const hasLower = !args.includes('--no-lower')

    let chars = ''
    if (hasLower) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (hasUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (hasNumbers) chars += '0123456789'
    if (hasSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (chars.length === 0) {
      return { output: '错误: 至少需要一种字符类型' }
    }

    let password = ''
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length]
    }

    let strength = 0
    if (length >= 8) strength++
    if (length >= 12) strength++
    if (length >= 16) strength++
    if (hasUpper && hasLower) strength++
    if (hasNumbers) strength++
    if (hasSymbols) strength++

    let strengthLabel = '弱'
    let strengthColor = '\x1b[31m'
    if (strength >= 5) { strengthLabel = '强'; strengthColor = '\x1b[32m' }
    else if (strength >= 3) { strengthLabel = '中'; strengthColor = '\x1b[33m' }

    const output: string[] = []
    output.push('🔑 密码生成器')
    output.push('═'.repeat(40))
    output.push('')
    output.push(`密码: \x1b[1;32m${password}\x1b[0m`)
    output.push('')
    output.push(`长度: ${length} 位`)
    output.push(`强度: ${strengthColor}${strengthLabel}\x1b[0m (${strength}/6)`)
    output.push('')

    return { output: output.join('\n') }
  },
  description: '生成随机密码',
  usage: 'password [长度] [选项]',
  examples: ['password', 'password 32', 'password 16 --no-symbols']
})

registerCommand('color', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🎨 颜色转换',
          '═'.repeat(40),
          '',
          '用法: color <HEX|RGB>',
          '',
          '示例:',
          '  color #ff0000',
          '  color "rgb(255, 0, 0)"',
          '',
        ].join('\n')
      }
    }

    const input = args.join(' ').trim()
    let r = 0, g = 0, b = 0

    const hexMatch = input.match(/^#?([0-9a-fA-F]{6})$/)
    const rgbMatch = input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    const shortMatch = input.match(/^#?([0-9a-fA-F]{3})$/)

    if (hexMatch) {
      r = parseInt(hexMatch[1].slice(0, 2), 16)
      g = parseInt(hexMatch[1].slice(2, 4), 16)
      b = parseInt(hexMatch[1].slice(4, 6), 16)
    } else if (shortMatch) {
      r = parseInt(shortMatch[1][0] + shortMatch[1][0], 16)
      g = parseInt(shortMatch[1][1] + shortMatch[1][1], 16)
      b = parseInt(shortMatch[1][2] + shortMatch[1][2], 16)
    } else if (rgbMatch) {
      r = parseInt(rgbMatch[1])
      g = parseInt(rgbMatch[2])
      b = parseInt(rgbMatch[3])
    } else {
      return { output: '错误: 无法解析颜色格式' }
    }

    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')

    const max = Math.max(r, g, b) / 255
    const min = Math.min(r, g, b) / 255
    const l = (max + min) / 2
    let h = 0, s = 0
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r / 255: h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6; break
        case g / 255: h = ((b / 255 - r / 255) / d + 2) / 6; break
        case b / 255: h = ((r / 255 - g / 255) / d + 4) / 6; break
      }
    }

    const output: string[] = []
    output.push('🎨 颜色信息')
    output.push('═'.repeat(40))
    output.push('')
    output.push(`  HEX: ${hex.toUpperCase()}`)
    output.push(`  RGB: rgb(${r}, ${g}, ${b})`)
    output.push(`  HSL: hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`)
    output.push('')

    return { output: output.join('\n') }
  },
  description: '颜色格式转换',
  usage: 'color <颜色>',
  examples: ['color #ff0000', 'color "rgb(255,0,0)"']
})

registerCommand('qrcode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📱 二维码生成',
          '═'.repeat(40),
          '',
          '用法: qrcode <文本或URL>',
          '',
          '示例:',
          '  qrcode https://example.com',
          '  qrcode Hello World',
          '',
        ].join('\n')
      }
    }

    const text = args.join(' ')
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`

    return {
      output: [
        '📱 二维码生成',
        '═'.repeat(40),
        '',
        `内容: ${text}`,
        '',
        `在线查看: ${url}`,
        '',
        '提示: 在浏览器中打开链接查看二维码图片',
        '',
      ].join('\n')
    }
  },
  description: '生成二维码',
  usage: 'qrcode <文本>',
  examples: ['qrcode https://example.com']
})

registerCommand('lorem', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = parseInt(args[0]) || 5
    
    if (count > 100) {
      return { output: '错误: 最多生成 100 个单词' }
    }

    const words = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur',
      'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor',
      'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna',
      'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis',
      'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
      'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis',
      'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur',
      'excepteur', 'sint', 'occaecat', 'cupidatat', 'non',
      'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
      'mollit', 'anim', 'id', 'est', 'laborum'
    ]

    let result = ''
    for (let i = 0; i < count; i++) {
      result += words[Math.floor(Math.random() * words.length)] + ' '
    }
    result = result.trim()
    result = result.charAt(0).toUpperCase() + result.slice(1) + '.'

    return {
      output: [
        '📝 Lorem Ipsum',
        '═'.repeat(40),
        '',
        result,
        '',
        `共 ${count} 个单词`,
        '',
      ].join('\n')
    }
  },
  description: '生成 Lorem Ipsum 占位文本',
  usage: 'lorem [单词数]',
  examples: ['lorem', 'lorem 20']
})

registerCommand('reverse', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    if (args.length === 0) {
      return { output: '用法: reverse <文本>\n反转文本内容' }
    }
    const text = args.join(' ')
    const reversed = text.split('').reverse().join('')
    return {
      output: [
        '🔄 文本反转',
        '═'.repeat(40),
        '',
        `原文: ${text}`,
        '',
        `反转: ${reversed}`,
        '',
      ].join('\n')
    }
  },
  description: '反转文本',
  usage: 'reverse <文本>',
  examples: ['reverse Hello World']
})

registerCommand('case', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    if (args.length < 2) {
      return {
        output: [
          '🔤 大小写转换',
          '═'.repeat(40),
          '',
          '用法: case <upper|lower|title|camel|snake> <文本>',
          '',
          '示例:',
          '  case upper hello world',
          '  case title hello world',
          '',
        ].join('\n')
      }
    }

    const mode = args[0]
    const text = args.slice(1).join(' ')
    let result = ''

    switch (mode) {
      case 'upper':
        result = text.toUpperCase()
        break
      case 'lower':
        result = text.toLowerCase()
        break
      case 'title':
        result = text.replace(/\b\w/g, c => c.toUpperCase())
        break
      case 'camel':
        result = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
        break
      case 'snake':
        result = text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
        break
      default:
        return { output: '错误: 不支持的模式' }
    }

    return {
      output: [
        '🔤 大小写转换',
        '═'.repeat(40),
        '',
        `原文: ${text}`,
        `模式: ${mode}`,
        '',
        `结果: ${result}`,
        '',
      ].join('\n')
    }
  },
  description: '文本大小写转换',
  usage: 'case <模式> <文本>',
  examples: ['case upper hello', 'case title hello world']
})
