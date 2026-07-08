import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('uuid', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = parseInt(args[0]) || 1
    const maxCount = Math.min(Math.max(count, 1), 100)

    const generateUUID = (): string => {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        try {
          return (crypto as Crypto).randomUUID()
        } catch {
          // fallback below
        }
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    const uuids: string[] = []
    for (let i = 0; i < maxCount; i++) {
      uuids.push(generateUUID())
    }

    return {
      output: [
        `🆔 生成 ${maxCount} 个 UUID`,
        '═'.repeat(40),
        '',
        ...uuids.map((u, i) => `${maxCount > 1 ? `${i + 1}. ` : ''}${u}`),
        '',
      ].join('\n')
    }
  },
  description: '生成UUID',
  usage: 'uuid [数量]',
  examples: ['uuid', 'uuid 5']
})

registerCommand('password', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const length = parseInt(args[0]) || 16
    const maxLength = Math.min(Math.max(length, 4), 128)

    let hasUpper = true
    let hasLower = true
    let hasNumber = true
    let hasSpecial = true

    for (const arg of args.slice(1)) {
      if (arg === '--no-upper') hasUpper = false
      if (arg === '--no-lower') hasLower = false
      if (arg === '--no-number') hasNumber = false
      if (arg === '--no-special') hasSpecial = false
    }

    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const number = '0123456789'
    const special = '!@#$%^&*()-_=+[]{};:,.<>?/|~'
    let pool = ''
    if (hasUpper) pool += upper
    if (hasLower) pool += lower
    if (hasNumber) pool += number
    if (hasSpecial) pool += special

    if (!pool) {
      return { output: '错误: 至少需要启用一种字符类型' }
    }

    let result = ''
    const arr = new Uint8Array(maxLength)
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      (crypto as Crypto).getRandomValues(arr)
      for (let i = 0; i < maxLength; i++) {
        result += pool[arr[i] % pool.length]
      }
    } else {
      for (let i = 0; i < maxLength; i++) {
        result += pool[Math.floor(Math.random() * pool.length)]
      }
    }

    let strength = 0
    if (maxLength >= 12) strength += 25
    if (hasUpper) strength += 25
    if (hasNumber) strength += 25
    if (hasSpecial) strength += 25

    const strengthLabel = strength >= 75 ? '强' : strength >= 50 ? '中' : '弱'
    const strengthColor = strength >= 75 ? '🟢' : strength >= 50 ? '🟡' : '🔴'

    return {
      output: [
        '🔐 密码生成器',
        '═'.repeat(40),
        '',
        `长度: ${maxLength}`,
        `字符类型: ${hasUpper ? '大写 ' : ''}${hasLower ? '小写 ' : ''}${hasNumber ? '数字 ' : ''}${hasSpecial ? '特殊字符' : ''}`,
        `强度: ${strengthColor} ${strengthLabel} (${strength}%)`,
        '',
        `密码: ${result}`,
        '',
      ].join('\n')
    }
  },
  description: '生成随机密码',
  usage: 'password [长度] [--no-upper] [--no-lower] [--no-number] [--no-special]',
  examples: ['password', 'password 20', 'password 16 --no-special']
})

registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      const now = Date.now()
      const nowSec = Math.floor(now / 1000)
      const date = new Date(now)

      return {
        output: [
          '⏰ 时间戳',
          '═'.repeat(40),
          '',
          `当前时间戳 (毫秒): ${now}`,
          `当前时间戳 (秒):    ${nowSec}`,
          '',
          `格式化时间: ${date.toLocaleString()}`,
          `ISO 格式:   ${date.toISOString()}`,
          '',
        ].join('\n')
      }
    }

    const input = args[0]
    let timestamp: number

    if (/^\d+$/.test(input)) {
      timestamp = parseInt(input)
      if (timestamp < 1e12) timestamp *= 1000
    } else {
      const parsed = new Date(input)
      if (isNaN(parsed.getTime())) {
        return { output: `错误: 无法解析时间 "${input}"` }
      }
      timestamp = parsed.getTime()
    }

    const date = new Date(timestamp)

    return {
      output: [
        '⏰ 时间戳转换',
        '═'.repeat(40),
        '',
        `输入: ${input}`,
        '',
        `毫秒时间戳: ${timestamp}`,
        `秒时间戳:   ${Math.floor(timestamp / 1000)}`,
        '',
        `本地时间: ${date.toLocaleString()}`,
        `ISO 格式: ${date.toISOString()}`,
        `UTC 时间: ${date.toUTCString()}`,
        '',
      ].join('\n')
    }
  },
  description: '时间戳转换工具',
  usage: 'timestamp [时间戳|日期]',
  examples: ['timestamp', 'timestamp 1609459200', 'timestamp 2024-01-01']
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
          '  json format <json字符串> - 格式化JSON',
          '  json minify <json字符串> - 压缩JSON',
          '  json validate <json字符串> - 验证JSON',
          '',
          '示例:',
          '  json format {"name":"test","value":123}',
          '',
        ].join('\n')
      }
    }

    const action = args[0].toLowerCase()
    const jsonStr = args.slice(1).join(' ')

    try {
      const obj = JSON.parse(jsonStr)

      if (action === 'format' || action === 'pretty') {
        return {
          output: [
            '📋 JSON 格式化结果',
            '═'.repeat(40),
            '',
            JSON.stringify(obj, null, 2),
            '',
          ].join('\n')
        }
      } else if (action === 'minify' || action === 'compress') {
        const minified = JSON.stringify(obj)
        return {
          output: [
            '📋 JSON 压缩结果',
            '═'.repeat(40),
            '',
            minified,
            '',
            `原始大小: ${jsonStr.length} 字符`,
            `压缩大小: ${minified.length} 字符`,
            `压缩率:   ${((1 - minified.length / jsonStr.length) * 100).toFixed(1)}%`,
            '',
          ].join('\n')
        }
      } else if (action === 'validate' || action === 'check') {
        return {
          output: [
            '📋 JSON 验证结果',
            '═'.repeat(40),
            '',
            '✅ JSON 格式有效',
            '',
            `数据类型: ${Array.isArray(obj) ? '数组' : '对象'}`,
            `顶层键数: ${typeof obj === 'object' && obj !== null ? Object.keys(obj).length : 0}`,
            '',
          ].join('\n')
        }
      } else {
        return { output: `未知操作: ${action}，请使用 format/minify/validate` }
      }
    } catch (err) {
      return {
        output: [
          '📋 JSON 验证结果',
          '═'.repeat(40),
          '',
          '❌ JSON 格式无效',
          '',
          `错误: ${err instanceof Error ? err.message : String(err)}`,
          '',
        ].join('\n')
      }
    }
  },
  description: 'JSON格式化/验证工具',
  usage: 'json <format|minify|validate> <json字符串>',
  examples: ['json format {"a":1}', 'json validate {"test": true}']
})

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
          '  + 加, - 减, * 乘, / 除',
          '  % 取模, ** 幂运算',
          '  () 括号',
          '',
          '示例:',
          '  calc 2+2',
          '  calc "(10+5)*2"',
          '  calc 2**10',
          '',
        ].join('\n')
      }
    }

    const expression = args.join(' ')

    try {
      if (!/^[\d+\-*/%().\s]+$/.test(expression)) {
        return { output: '错误: 表达式包含非法字符' }
      }

      const result = Function('"use strict"; return (' + expression + ')')()

      return {
        output: [
          '🧮 计算结果',
          '═'.repeat(40),
          '',
          `表达式: ${expression}`,
          `结果:   ${result}`,
          '',
        ].join('\n')
      }
    } catch (err) {
      return {
        output: [
          '🧮 计算错误',
          '═'.repeat(40),
          '',
          `表达式: ${expression}`,
          `错误: ${err instanceof Error ? err.message : String(err)}`,
          '',
        ].join('\n')
      }
    }
  },
  description: '计算器',
  usage: 'calc <表达式>',
  examples: ['calc 2+2', 'calc "(10+5)*2"']
})

registerCommand('jwt', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '🎫 JWT 解码工具',
          '═'.repeat(40),
          '',
          '用法: jwt decode <token>',
          '',
          '示例:',
          '  jwt decode eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
          '',
        ].join('\n')
      }
    }

    const action = args[0].toLowerCase()
    const token = args[1]

    if (action !== 'decode') {
      return { output: `未知操作: ${action}，请使用 decode` }
    }

    if (!token || !token.includes('.')) {
      return { output: '错误: 无效的 JWT 格式' }
    }

    const parts = token.split('.')
    if (parts.length !== 3) {
      return { output: '错误: JWT 应包含 3 个部分' }
    }

    try {
      const decodeBase64Url = (str: string): string => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4) base64 += '='
        return decodeURIComponent(escape(atob(base64)))
      }

      const header = JSON.parse(decodeBase64Url(parts[0]))
      const payload = JSON.parse(decodeBase64Url(parts[1]))

      const lines: string[] = [
        '🎫 JWT 解码结果',
        '═'.repeat(40),
        '',
        'Header:',
        JSON.stringify(header, null, 2),
        '',
        'Payload:',
        JSON.stringify(payload, null, 2),
        '',
      ]

      if (payload.iat) {
        lines.push(`签发时间: ${new Date(payload.iat * 1000).toLocaleString()}`)
      }
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000)
        const expired = expDate.getTime() < Date.now()
        lines.push(`过期时间: ${expDate.toLocaleString()} ${expired ? '(已过期)' : '(有效)'}`)
      }

      lines.push('')

      return { output: lines.join('\n') }
    } catch (err) {
      return { output: `错误: 解码失败 - ${err instanceof Error ? err.message : String(err)}` }
    }
  },
  description: 'JWT解码工具',
  usage: 'jwt decode <token>',
  examples: ['jwt decode eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...']
})

registerCommand('lorem', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    let type: 'words' | 'sentences' | 'paragraphs' = 'paragraphs'
    let count = 3

    const WORDS = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
      'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
      'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
      'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
      'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
    ]

    const rand = (n: number) => Math.floor(Math.random() * n)
    const pickWord = (): string => WORDS[rand(WORDS.length)]

    const generateSentence = (): string => {
      const wordCount = 5 + rand(15)
      const words: string[] = []
      for (let i = 0; i < wordCount; i++) {
        words.push(pickWord())
      }
      const sentence = words.join(' ')
      return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
    }

    const generateParagraph = (): string => {
      const sentenceCount = 3 + rand(6)
      const sentences: string[] = []
      for (let i = 0; i < sentenceCount; i++) {
        sentences.push(generateSentence())
      }
      return sentences.join(' ')
    }

    if (args.length > 0) {
      if (['words', 'sentences', 'paragraphs', 'w', 's', 'p'].includes(args[0])) {
        type = args[0] === 'w' ? 'words' : args[0] === 's' ? 'sentences' : args[0] === 'p' ? 'paragraphs' : args[0] as 'words' | 'sentences' | 'paragraphs'
        if (args[1]) count = Math.min(Math.max(parseInt(args[1]) || 1, 1), 100)
      } else {
        count = Math.min(Math.max(parseInt(args[0]) || 1, 1), 100)
      }
    }

    let result = ''

    if (type === 'words') {
      const words: string[] = []
      for (let i = 0; i < count; i++) {
        words.push(pickWord())
      }
      result = words.join(' ')
    } else if (type === 'sentences') {
      const sentences: string[] = []
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence())
      }
      result = sentences.join(' ')
    } else {
      const paragraphs: string[] = []
      for (let i = 0; i < count; i++) {
        paragraphs.push(generateParagraph())
      }
      result = paragraphs.join('\n\n')
    }

    return {
      output: [
        `📝 Lorem Ipsum (${count} ${type === 'words' ? '单词' : type === 'sentences' ? '句子' : '段落'})`,
        '═'.repeat(40),
        '',
        result,
        '',
      ].join('\n')
    }
  },
  description: '生成Lorem Ipsum占位文本',
  usage: 'lorem [类型] [数量]',
  examples: ['lorem', 'lorem 5', 'lorem words 50', 'lorem p 3']
})

registerCommand('hex', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length < 2) {
      return {
        output: [
          '🔤 进制转换',
          '═'.repeat(40),
          '',
          '用法:',
          '  hex encode <文本> - 文本转十六进制',
          '  hex decode <十六进制> - 十六进制转文本',
          '  hex from <进制> <数字> - 数字转多进制',
          '',
          '支持的进制: bin(2), oct(8), dec(10), hex(16)',
          '',
          '示例:',
          '  hex encode Hello',
          '  hex decode 48656c6c6f',
          '  hex from 10 255',
          '',
        ].join('\n')
      }
    }

    const action = args[0].toLowerCase()

    if (action === 'encode') {
      const text = args.slice(1).join(' ')
      let hex = ''
      for (let i = 0; i < text.length; i++) {
        hex += text.charCodeAt(i).toString(16).padStart(2, '0')
      }
      return {
        output: [
          '🔤 十六进制编码',
          '═'.repeat(40),
          '',
          `原文: ${text}`,
          `十六进制: ${hex}`,
          '',
        ].join('\n')
      }
    }

    if (action === 'decode') {
      const hex = args[1].replace(/\s/g, '')
      try {
        let text = ''
        for (let i = 0; i < hex.length; i += 2) {
          text += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
        }
        return {
          output: [
            '🔤 十六进制解码',
            '═'.repeat(40),
            '',
            `十六进制: ${hex}`,
            `原文: ${text}`,
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 无效的十六进制字符串' }
      }
    }

    if (action === 'from') {
      const baseStr = args[1]
      const numStr = args[2]
      let fromBase = 10

      if (baseStr === 'bin' || baseStr === '2') fromBase = 2
      else if (baseStr === 'oct' || baseStr === '8') fromBase = 8
      else if (baseStr === 'dec' || baseStr === '10') fromBase = 10
      else if (baseStr === 'hex' || baseStr === '16') fromBase = 16
      else fromBase = parseInt(baseStr)

      const num = parseInt(numStr, fromBase)
      if (isNaN(num)) {
        return { output: '错误: 无效的数字' }
      }

      return {
        output: [
          '🔤 进制转换',
          '═'.repeat(40),
          '',
          `输入: ${numStr} (${fromBase}进制)`,
          '',
          `二进制 (2):  ${num.toString(2)}`,
          `八进制 (8):  ${num.toString(8)}`,
          `十进制 (10): ${num.toString(10)}`,
          `十六进制 (16): ${num.toString(16).toUpperCase()}`,
          '',
        ].join('\n')
      }
    }

    return { output: `未知操作: ${action}` }
  },
  description: '进制转换工具',
  usage: 'hex <encode|decode|from> <参数>',
  examples: ['hex encode Hello', 'hex from 10 255']
})
