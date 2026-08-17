import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error('HTTP error')
    return await response.json()
  } catch {
    return null
  }
}

registerCommand('calc', {
  handler: (context: CommandContext): CommandResult => {
    const expr = context.args.join(' ')
    if (!expr) {
      return {
        output: [
          '科学计算器',
          '',
          '用法: calc <表达式>',
          '',
          '支持: +, -, *, /, %, ^, sqrt, sin, cos, tan, log, pi, e',
          '',
          '示例:',
          '  calc 2 + 3 * 4',
          '  calc sqrt(16)',
          '  calc sin(pi/2)',
          '  calc log(100)',
        ].join('\n')
      }
    }

    try {
      let processed = expr
        .replace(/\bsqrt\(/g, 'Math.sqrt(')
        .replace(/\bsin\(/g, 'Math.sin(')
        .replace(/\bcos\(/g, 'Math.cos(')
        .replace(/\btan\(/g, 'Math.tan(')
        .replace(/\blog\(/g, 'Math.log10(')
        .replace(/\bln\(/g, 'Math.log(')
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')
        .replace(/\^/g, '**')

      const result = Function(`"use strict"; return (${processed})`)()

      if (typeof result === 'number' && isFinite(result)) {
        return {
          output: [
            `计算结果: ${expr}`,
            `= ${result}`,
          ].join('\n')
        }
      }
      return { output: '错误: 计算结果无效' }
    } catch (err) {
      return { output: `错误: ${err instanceof Error ? err.message : '无效的表达式'}` }
    }
  },
  description: '科学计算器',
  usage: 'calc <表达式>',
  examples: ['calc 2 + 3', 'calc sqrt(16)', 'calc sin(pi/2)']
})

registerCommand('password-gen', {
  handler: (context: CommandContext): CommandResult => {
    const length = parseInt(context.args[0]) || 16
    const charset = context.args[1]

    const charsets: Record<string, string> = {
      all: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',
      alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      num: '0123456789',
      symbol: '!@#$%^&*',
    }

    const chars = charset ? (charsets[charset] || charsets.all) : charsets.all
    let password = ''
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)

    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length]
    }

    const strength = length >= 16 ? '强' : length >= 12 ? '中等' : '弱'

    return {
      output: [
        '密码生成器',
        '',
        `长度: ${length}`,
        `字符集: ${charset || 'all'}`,
        `强度: ${strength}`,
        '',
        `生成的密码:`,
        `${password}`,
      ].join('\n')
    }
  },
  description: '生成随机安全密码',
  usage: 'password-gen [长度] [字符集]',
  examples: ['password-gen 16', 'password-gen 32 all', 'password-gen 12 num']
})

registerCommand('unit', {
  handler: (context: CommandContext): CommandResult => {
    const [value, fromUnit, toUnit] = context.args

    if (!value || !fromUnit || !toUnit) {
      return {
        output: [
          '单位转换器',
          '',
          '支持的转换:',
          '  温度: celsius, fahrenheit, kelvin',
          '  长度: meter, kilometer, mile, foot',
          '  重量: kilogram, pound, ounce',
          '  数据: byte, kilobyte, megabyte, gigabyte',
          '',
          '用法: unit <值> <源单位> <目标单位>',
          '',
          '示例:',
          '  unit 100 celsius fahrenheit',
          '  unit 1 kilometer mile',
          '  unit 1 kilogram pound',
        ].join('\n')
      }
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      return { output: '错误: 无效的数值' }
    }

    const conversions: Record<string, (v: number) => number> = {
      'celsius-fahrenheit': (v) => v * 9 / 5 + 32,
      'celsius-kelvin': (v) => v + 273.15,
      'fahrenheit-celsius': (v) => (v - 32) * 5 / 9,
      'fahrenheit-kelvin': (v) => (v - 32) * 5 / 9 + 273.15,
      'kelvin-celsius': (v) => v - 273.15,
      'kelvin-fahrenheit': (v) => (v - 273.15) * 9 / 5 + 32,
      'meter-kilometer': (v) => v / 1000,
      'meter-mile': (v) => v / 1609.344,
      'meter-foot': (v) => v * 3.28084,
      'kilometer-meter': (v) => v * 1000,
      'kilometer-mile': (v) => v * 0.621371,
      'mile-meter': (v) => v * 1609.344,
      'mile-kilometer': (v) => v * 1.609344,
      'mile-foot': (v) => v * 5280,
      'foot-meter': (v) => v / 3.28084,
      'foot-mile': (v) => v / 5280,
      'kilogram-pound': (v) => v * 2.20462,
      'kilogram-ounce': (v) => v * 35.274,
      'pound-kilogram': (v) => v / 2.20462,
      'pound-ounce': (v) => v * 16,
      'ounce-kilogram': (v) => v / 35.274,
      'ounce-pound': (v) => v / 16,
      'byte-kilobyte': (v) => v / 1024,
      'byte-megabyte': (v) => v / 1024 / 1024,
      'byte-gigabyte': (v) => v / 1024 / 1024 / 1024,
      'kilobyte-byte': (v) => v * 1024,
      'kilobyte-megabyte': (v) => v / 1024,
      'kilobyte-gigabyte': (v) => v / 1024 / 1024,
      'megabyte-byte': (v) => v * 1024 * 1024,
      'megabyte-kilobyte': (v) => v * 1024,
      'megabyte-gigabyte': (v) => v / 1024,
      'gigabyte-byte': (v) => v * 1024 * 1024 * 1024,
      'gigabyte-kilobyte': (v) => v * 1024 * 1024,
      'gigabyte-megabyte': (v) => v * 1024,
    }

    const key = `${fromUnit.toLowerCase()}-${toUnit.toLowerCase()}`
    const converter = conversions[key]

    if (!converter) {
      return {
        output: [
          `不支持的转换: ${fromUnit} -> ${toUnit}`,
          '',
          '支持的转换对示例:',
          '  celsius-fahrenheit, meter-mile, kilogram-pound, byte-megabyte',
        ].join('\n')
      }
    }

    const result = converter(numValue)
    return {
      output: [
        `${numValue} ${fromUnit} = ${result.toFixed(4)} ${toUnit}`,
      ].join('\n')
    }
  },
  description: '单位转换器',
  usage: 'unit <值> <源单位> <目标单位>',
  examples: ['unit 100 celsius fahrenheit', 'unit 1 kilometer mile']
})

registerCommand('ip-info', {
  handler: async (): Promise<CommandResult> => {
    const ipData = await fetchJson<{
      ip: string
      city: string
      region: string
      country: string
      org: string
      timezone: string
      lat: number
      lon: number
    }>('https://ipapi.co/json/')

    if (!ipData?.ip) {
      return {
        output: [
          'IP 地址查询',
          '',
          '无法获取 IP 信息',
          '提示: 请检查网络连接',
        ].join('\n')
      }
    }

    return {
      output: [
        'IP 地址信息',
        '',
        `IP: ${ipData.ip}`,
        `城市: ${ipData.city || '未知'}`,
        `地区: ${ipData.region || '未知'}`,
        `国家: ${ipData.country || '未知'}`,
        `运营商: ${ipData.org || '未知'}`,
        `时区: ${ipData.timezone || '未知'}`,
        `坐标: ${ipData.lat?.toFixed(4) || '未知'}, ${ipData.lon?.toFixed(4) || '未知'}`,
      ].join('\n')
    }
  },
  description: '查询当前IP地址信息',
  usage: 'ip-info',
  examples: ['ip-info']
})

registerCommand('uuid-gen', {
  handler: (): CommandResult => {
    const generateUUID = (): string => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    }

    const uuids = Array.from({ length: 5 }, () => generateUUID())

    return {
      output: [
        'UUID 生成器',
        '',
        '生成的 UUID (v4):',
        '',
        ...uuids.map((u, i) => `${i + 1}. ${u}`),
        '',
        '格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
      ].join('\n')
    }
  },
  description: '生成 UUID',
  usage: 'uuid-gen',
  examples: ['uuid-gen']
})

registerCommand('color-info', {
  handler: (context: CommandContext): CommandResult => {
    const color = context.args.join(' ')
    if (!color) {
      return {
        output: [
          '颜色转换工具',
          '',
          '用法: color-info <颜色值>',
          '',
          '支持格式:',
          '  HEX: #FF6B6B 或 FF6B6B',
          '  RGB: rgb(255, 107, 107)',
          '  颜色名: red, blue, green, yellow...',
          '',
          '示例:',
          '  color-info #FF6B6B',
          '  color-info rgb(255, 107, 107)',
        ].join('\n')
      }
    }

    let r = 0, g = 0, b = 0

    if (color.startsWith('#')) {
      const hex = color.slice(1)
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16)
        g = parseInt(hex[1] + hex[1], 16)
        b = parseInt(hex[2] + hex[2], 16)
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16)
        g = parseInt(hex.slice(2, 4), 16)
        b = parseInt(hex.slice(4, 6), 16)
      } else {
        return { output: '错误: 无效的 HEX 颜色值' }
      }
    } else if (color.startsWith('rgb(')) {
      const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
      if (match) {
        r = parseInt(match[1])
        g = parseInt(match[2])
        b = parseInt(match[3])
      } else {
        return { output: '错误: 无效的 RGB 格式' }
      }
    } else {
      const namedColors: Record<string, [number, number, number]> = {
        red: [255, 0, 0],
        green: [0, 128, 0],
        blue: [0, 0, 255],
        yellow: [255, 255, 0],
        orange: [255, 165, 0],
        purple: [128, 0, 128],
        pink: [255, 192, 203],
        white: [255, 255, 255],
        black: [0, 0, 0],
        gray: [128, 128, 128],
      }
      const named = namedColors[color.toLowerCase()]
      if (named) {
        [r, g, b] = named
      } else {
        return { output: '错误: 无法识别的颜色格式' }
      }
    }

    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`

    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    const textColor = brightness > 128 ? '#000000' : '#FFFFFF'

    return {
      output: [
        '颜色信息',
        '',
        `HEX: ${hex}`,
        `RGB: rgb(${r}, ${g}, ${b})`,
        `亮度: ${brightness.toFixed(1)} (建议文字颜色: ${textColor})`,
        '',
        `颜色预览: ${hex}`,
      ].join('\n')
    }
  },
  description: '颜色转换工具',
  usage: 'color-info <颜色值>',
  examples: ['color-info #FF6B6B', 'color-info rgb(255, 107, 107)']
})

registerCommand('emoji-search', {
  handler: (context: CommandContext): CommandResult => {
    const query = context.args.join(' ').toLowerCase()
    const emojiCategories: Record<string, string[]> = {
      'happy': ['😊', '😄', '😃', '😁', '😆', '🤣', '😂', '🙂', '😌'],
      'sad': ['😢', '😭', '😤', '😞', '😔', '😟', '😕', '🙁', '☹️'],
      'love': ['❤️', '💔', '💕', '💖', '💗', '💓', '💝', '🖤', '🤍'],
      'thumbs': ['👍', '👎', '👌', '🤌', '🤏'],
      'fire': ['🔥', '💥', '✨', '⭐', '🌟', '⚡'],
      'money': ['💰', '💵', '💴', '💶', '💷', '💎', '💳'],
      'food': ['🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯'],
      'drink': ['☕', '🍵', '🥤', '🧋', '🧃', '🧊'],
      'animal': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
      'nature': ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🍀'],
      'weather': ['☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '⛈️', '🌧️'],
      'tech': ['💻', '🖥️', '📱', '⌚', '🖱️', '⌨️', '🖨️'],
    }

    if (!query) {
      return {
        output: [
          '表情符号查询',
          '',
          '支持的类别:',
          Object.keys(emojiCategories).join(', '),
          '',
          '用法: emoji-search <类别>',
          '示例: emoji-search happy',
        ].join('\n')
      }
    }

    const category = emojiCategories[query]
    if (category) {
      return {
        output: [
          `表情符号 - ${query}`,
          '',
          category.join(' '),
        ].join('\n')
      }
    }

    const matches = Object.entries(emojiCategories)
      .filter(([key]) => key.includes(query))
      .flatMap(([, emojis]) => emojis)
      .slice(0, 20)

    if (matches.length > 0) {
      return {
        output: [
          `表情符号搜索 "${query}":`,
          '',
          matches.join(' '),
        ].join('\n')
      }
    }

    return {
      output: [
        `未找到匹配 "${query}" 的表情符号`,
        '',
        '试试这些类别:',
        Object.keys(emojiCategories).join(', '),
      ].join('\n')
    }
  },
  description: '表情符号查询',
  usage: 'emoji-search <类别>',
  examples: ['emoji-search happy', 'emoji-search food']
})

registerCommand('fortune-today', {
  handler: (): CommandResult => {
    const fortunes = [
      '今天会有意外的好运降临。',
      '保持微笑，好事即将发生。',
      '勇敢面对挑战，你会成功的。',
      '小心行事，但不要畏惧前行。',
      '学习新事物的时机到了。',
      '与朋友聚会会带来快乐。',
      '注意身体健康，多休息。',
      '你的创造力即将爆发。',
      '把握眼前的机会。',
      '相信直觉，它不会欺骗你。',
      '适合反思和规划的一天。',
      '你的努力将会得到回报。',
    ]

    const colors = ['红', '橙', '黄', '绿', '蓝', '紫']
    const luckyNumbers = [3, 5, 7, 8, 9, 12, 16, 21, 28, 36]

    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)]
    const color = colors[Math.floor(Math.random() * colors.length)]
    const number = luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)]

    return {
      output: [
        '运势占卜',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `今日运势: ${fortune}`,
        '',
        `幸运数字: ${number}`,
        `幸运颜色: ${color}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '免责声明: 仅供娱乐',
      ].join('\n')
    }
  },
  description: '每日运势占卜',
  usage: 'fortune-today',
  examples: ['fortune-today']
})

registerCommand('short-link', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const url = context.args.join(' ')
    if (!url) {
      return {
        output: [
          'URL 缩短器',
          '',
          '用法: short-link <URL>',
          '',
          '示例: short-link https://github.com/saya-ch/WebLinuxOS',
        ].join('\n')
      }
    }

    try {
      const isGdUrl = await fetchJson<{ shorturl: string }>(`https://gd.is?api=1&url=${encodeURIComponent(url)}`)

      if (isGdUrl?.shorturl) {
        return {
          output: [
            'URL 缩短成功',
            '',
            `原URL: ${url}`,
            `短链接: ${isGdUrl.shorturl}`,
          ].join('\n')
        }
      }

      return { output: '错误: URL 缩短服务暂时不可用，请稍后重试' }
    } catch {
      return { output: '错误: 网络请求失败' }
    }
  },
  description: 'URL 缩短器',
  usage: 'short-link <URL>',
  examples: ['short-link https://github.com']
})

registerCommand('quote-random', {
  handler: async (): Promise<CommandResult> => {
    const quote = await fetchJson<{
      content: string
      author: string
    }>('https://api.quotable.io/random')

    if (quote?.content) {
      return {
        output: [
          '名言警句',
          '',
          `"${quote.content}"`,
          '',
          `— ${quote.author}`,
        ].join('\n')
      }
    }

    const fallbackQuotes = [
      { content: '代码即诗，简洁即美。', author: 'WebLinuxOS' },
      { content: '真正的问题不是技术，而是人。', author: '未知' },
      { content: '让代码说话，让设计闪耀。', author: 'WebLinuxOS' },
    ]
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
    return {
      output: [
        '名言警句',
        '',
        `"${randomQuote.content}"`,
        '',
        `— ${randomQuote.author}`,
      ].join('\n')
    }
  },
  description: '获取随机名言',
  usage: 'quote-random',
  examples: ['quote-random']
})
