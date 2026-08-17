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

// ── neofetch ──────────────────────────────────────────────
registerCommand('neofetch', {
  handler: (context: CommandContext): CommandResult => {
    const ua = navigator.userAgent
    const cpuCores = navigator.hardwareConcurrency || 0
    const nav = navigator as Navigator & {
      deviceMemory?: number
      connection?: { effectiveType?: string; downlink?: number }
    }
    const deviceMemory = nav.deviceMemory || 0
    const screenInfo = window.screen
    const languages = navigator.languages?.join(', ') || navigator.language
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const online = navigator.onLine
    const connection = nav.connection

    const parseBrowser = (userAgent: string): string => {
      if (/Edg\/([\d.]+)/.test(userAgent)) return `Edge ${RegExp.$1}`
      if (/OPR\/([\d.]+)/.test(userAgent)) return `Opera ${RegExp.$1}`
      if (/Firefox\/([\d.]+)/.test(userAgent)) return `Firefox ${RegExp.$1}`
      if (/Chrome\/([\d.]+)/.test(userAgent)) return `Chrome ${RegExp.$1}`
      if (/Version\/([\d.]+).*Safari/.test(userAgent)) return `Safari ${RegExp.$1}`
      return 'Unknown'
    }

    const parseOS = (userAgent: string): string => {
      if (/Windows NT ([\d.]+)/.test(userAgent)) return `Windows NT ${RegExp.$1}`
      if (/iPhone OS ([\d_]+)/.test(userAgent)) return `iOS ${RegExp.$1.replace(/_/g, '.')}`
      if (/Android ([\d.]+)/.test(userAgent)) return `Android ${RegExp.$1}`
      if (/Mac OS X ([\d_]+)/.test(userAgent)) return `macOS ${RegExp.$1.replace(/_/g, '.')}`
      if (/Linux/.test(userAgent)) return 'Linux'
      return 'Unknown'
    }

    const browser = parseBrowser(ua)
    const os = parseOS(ua)
    const shellVersion = 'WebLinuxOS-Terminal v2.0'
    const uptimeSeconds = Math.floor(performance.now() / 1000)
    const formatUptime = (sec: number): string => {
      const d = Math.floor(sec / 86400)
      const h = Math.floor((sec % 86400) / 3600)
      const m = Math.floor((sec % 3600) / 60)
      const s = sec % 60
      if (d > 0) return `${d}d ${h}h ${m}m`
      if (h > 0) return `${h}h ${m}m ${s}s`
      if (m > 0) return `${m}m ${s}s`
      return `${s}s`
    }

    const color = '\x1b[36m'
    const bold = '\x1b[1m'
    const green = '\x1b[32m'
    const yellow = '\x1b[33m'
    const cyan = '\x1b[36m'
    const reset = '\x1b[0m'

    const logo = [
      `${color}       .--.       ${reset}`,
      `${color}      |o_o |      ${reset}`,
      `${color}      |:_/ |      ${reset}`,
      `${color}     //   \\ \\     ${reset}`,
      `${color}    (|     | )    ${reset}`,
      `${color}   /'\\_   _/\`\\   ${reset}`,
      `${color}   \\___)=(___/   ${reset}`,
    ]

    const info = [
      `${bold}${green}${context.username}${reset}${bold}@${reset}${bold}${green}${context.hostname}${reset}`,
      '',
      `${bold}${cyan}OS:${reset}       WebLinuxOS 2.0 (${os})`,
      `${bold}${cyan}Host:${reset}     ${context.hostname}`,
      `${bold}${cyan}Kernel:${reset}  WebKernel v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0'}`,
      `${bold}${cyan}Uptime:${reset}   ${formatUptime(uptimeSeconds)}`,
      `${bold}${cyan}Shell:${reset}    ${shellVersion}`,
      `${bold}${cyan}Theme:${reset}    ${context.theme} (${window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'})`,
      `${bold}${cyan}CPU:${reset}      ${cpuCores} cores (${browser})`,
      `${bold}${cyan}Memory:${reset}  ${deviceMemory ? `${deviceMemory} GB` : 'N/A'}`,
      `${bold}${cyan}Screen:${reset}  ${screenInfo.width}x${screenInfo.height} @ ${window.devicePixelRatio}x`,
      `${bold}${cyan}Terminal:${reset} ${window.innerWidth}x${window.innerHeight}`,
      `${bold}${cyan}Network:${reset} ${online ? `${green}Online${reset}` : `${yellow}Offline${reset}`}${connection ? ` · ${connection.effectiveType || 'unknown'}` : ''}`,
      `${bold}${cyan}Language:${reset} ${languages}`,
      `${bold}${cyan}Timezone:${reset} ${timezone}`,
      `${bold}${cyan}Date:${reset}    ${new Date().toLocaleString('zh-CN')}`,
    ]

    const maxLines = Math.max(logo.length, info.length)
    const lines: string[] = []

    for (let i = 0; i < maxLines; i++) {
      const l = logo[i] || ' '.repeat(23)
      const r = info[i] || ''
      lines.push(`${l}  ${r}`)
    }

    return {
      output: lines.join('\n')
    }
  },
  description: 'neofetch 风格的系统信息展示',
  usage: 'neofetch',
  examples: ['neofetch']
})

// ── theme ─────────────────────────────────────────────────
registerCommand('theme', {
  handler: (context: CommandContext): CommandResult => {
    const arg = (context.args[0] || '').toLowerCase().trim()

    if (!arg) {
      const themeNames: Record<string, string> = { dark: '深色 🌙', light: '浅色 ☀️', auto: '自动 🎯' }
      return {
        output: [
          '主题切换',
          '',
          `当前主题: ${themeNames[context.theme] || context.theme}`,
          '',
          '用法: theme <dark|light|auto>',
          '',
          '示例:',
          '  theme dark   # 切换为深色主题',
          '  theme light  # 切换为浅色主题',
          '  theme auto   # 跟随系统主题',
        ].join('\n')
      }
    }

    const validThemes = ['dark', 'light', 'auto'] as const
    type ThemeValue = (typeof validThemes)[number]

    if (!validThemes.includes(arg as ThemeValue)) {
      return {
        output: [
          `无效的主题: ${arg}`,
          '',
          '可选主题:',
          '  dark  - 深色主题 🌙',
          '  light - 浅色主题 ☀️',
          '  auto  - 自动跟随系统 🎯',
          '',
          '用法: theme <dark|light|auto>',
        ].join('\n')
      }
    }

    try {
      const root = document.documentElement
      const themeAttr = 'data-theme'

      if (arg === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.setAttribute(themeAttr, prefersDark ? 'dark' : 'light')
        root.classList.remove('theme-dark', 'theme-light')
        root.classList.add(prefersDark ? 'theme-dark' : 'theme-light')
      } else {
        root.setAttribute(themeAttr, arg)
        root.classList.remove('theme-dark', 'theme-light')
        root.classList.add(`theme-${arg}`)
      }

      const themeNames: Record<string, string> = { dark: '深色 🌙', light: '浅色 ☀️', auto: '自动 🎯' }
      return {
        output: [
          `✅ 主题已切换为: ${themeNames[arg]}`,
          '',
          '提示: 刷新页面后主题将保持不变',
        ].join('\n')
      }
    } catch (err) {
      return {
        output: `❌ 主题切换失败: ${err instanceof Error ? err.message : String(err)}`
      }
    }
  },
  description: '切换 WebLinuxOS 主题 (dark/light/auto)',
  usage: 'theme [dark|light|auto]',
  examples: ['theme', 'theme dark', 'theme light', 'theme auto']
})

// ── weather ───────────────────────────────────────────────
registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const city = context.args.join(' ').trim()
    if (!city) {
      return {
        output: [
          '天气查询 (Open-Meteo)',
          '',
          '用法: weather <城市名>',
          '',
          '示例:',
          '  weather Beijing',
          '  weather Shanghai',
          '  weather New York',
          '  weather Tokyo',
        ].join('\n')
      }
    }

    const geocoding = await fetchJson<{
      results?: Array<{
        latitude: number
        longitude: number
        name: string
        country: string
        admin1?: string
      }>
    }>(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`)

    if (!geocoding?.results?.length) {
      return {
        output: [
          `❌ 未找到城市: ${city}`,
          '',
          '提示: 请检查城市名称拼写',
          '支持中文和英文城市名',
        ].join('\n')
      }
    }

    const loc = geocoding.results[0]
    const weather = await fetchJson<{
      current: {
        temperature_2m: number
        apparent_temperature: number
        relative_humidity_2m: number
        wind_speed_10m: number
        wind_direction_10m: number
        weather_code: number
      }
      daily: {
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        weather_code: number[]
      }
    }>(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
    )

    if (!weather?.current) {
      return {
        output: '❌ 天气数据获取失败，请稍后重试'
      }
    }

    const wmoCodes: Record<number, string> = {
      0: '晴 ☀️', 1: '大部晴朗 🌤️', 2: '多云 ⛅', 3: '阴天 ☁️',
      45: '雾 🌫️', 48: '雾凇 🌫️',
      51: '小毛雨 🌦️', 53: '毛雨 🌦️', 55: '大毛雨 🌧️',
      61: '小雨 🌧️', 63: '中雨 🌧️', 65: '大雨 🌧️',
      71: '小雪 🌨️', 73: '中雪 🌨️', 75: '大雪 🌨️',
      80: '阵雨 🌦️', 81: '中阵雨 🌦️', 82: '强阵雨 🌧️',
      95: '雷暴 ⛈️', 96: '雷暴伴冰雹 ⛈️', 99: '强雷暴伴冰雹 ⛈️',
    }

    const curr = weather.current
    const weatherDesc = wmoCodes[curr.weather_code] || '未知'

    const windDirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
    const windIdx = Math.round(curr.wind_direction_10m / 45) % 8
    const windDir = windDirs[windIdx]

    const color = '\x1b[36m'
    const bold = '\x1b[1m'
    const yellow = '\x1b[33m'
    const blue = '\x1b[34m'
    const reset = '\x1b[0m'

    const lines: string[] = []
    lines.push(`${bold}${color}╔══════════════════════════════════╗${reset}`)
    lines.push(`${bold}${color}║        天气查询结果               ║${reset}`)
    lines.push(`${bold}${color}╚══════════════════════════════════╝${reset}`)
    lines.push('')
    lines.push(`${bold}📍 位置:${reset} ${loc.name}, ${loc.admin1 || ''} ${loc.country}`)
    lines.push('')
    lines.push(`${bold}${yellow}当前天气${reset}`)
    lines.push(`  天气:     ${weatherDesc}`)
    lines.push(`  温度:     ${curr.temperature_2m}°C (体感 ${curr.apparent_temperature}°C)`)
    lines.push(`  湿度:     ${curr.relative_humidity_2m}%`)
    lines.push(`  风速:     ${curr.wind_speed_10m} km/h ${windDir}风`)
    lines.push('')

    if (weather.daily?.temperature_2m_max) {
      lines.push(`${bold}${blue}今日预报${reset}`)
      lines.push(`  最高温:   ${weather.daily.temperature_2m_max[0]}°C`)
      lines.push(`  最低温:   ${weather.daily.temperature_2m_min[0]}°C`)
      const dailyDesc = wmoCodes[weather.daily.weather_code[0]] || '未知'
      lines.push(`  天气:     ${dailyDesc}`)
    }

    lines.push('')
    lines.push(`数据来源: Open-Meteo API`)

    return { output: lines.join('\n') }
  },
  description: '查询城市天气 (Open-Meteo API)',
  usage: 'weather <城市名>',
  examples: ['weather Beijing', 'weather Shanghai', 'weather Tokyo']
})

// ── quote ──────────────────────────────────────────────────
registerCommand('quote', {
  handler: async (): Promise<CommandResult> => {
    const data = await fetchJson<Array<{
      q: string
      a: string
      h: string
    }>>('https://zenquotes.io/api/random')

    if (data && Array.isArray(data) && data[0]?.q) {
      const q = data[0]
      return {
        output: [
          '每日名言',
          '',
          `"${q.q}"`,
          '',
          `— ${q.a}`,
        ].join('\n')
      }
    }

    const fallbackQuotes = [
      { q: '代码是写给人看的，只是顺便让机器执行。', a: 'Harold Abelson' },
      { q: '简单优于复杂，复杂优于晦涩。', a: 'Zen of Python' },
      { q: '先让它工作，再让它正确，最后让它更快。', a: 'Kent Beck' },
      { q: '过早优化是万恶之源。', a: 'Donald Knuth' },
      { q: '真正的大师永远怀着一颗学徒的心。', a: 'WebLinuxOS' },
      { q: '代码如诗，简洁为美。', a: 'WebLinuxOS' },
      { q: '不写代码的时间用来思考架构。', a: 'Martin Fowler' },
      { q: '最好的代码是你不需要写的代码。', a: 'Jeff Atwood' },
      { q: '计算机科学的核心问题是缓存和命名难题。', a: 'Phil Karlton' },
    ]
    const q = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
    return {
      output: [
        '每日名言',
        '',
        `"${q.q}"`,
        '',
        `— ${q.a}`,
      ].join('\n')
    }
  },
  description: '获取每日名言 (ZenQuotes API)',
  usage: 'quote',
  examples: ['quote']
})

// ── crypto ────────────────────────────────────────────────
registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const arg = (context.args[0] || '').toLowerCase().trim()

    const coinMap: Record<string, { id: string; symbol: string; name: string }> = {
      btc: { id: 'bitcoin', symbol: 'BTC', name: '比特币' },
      bitcoin: { id: 'bitcoin', symbol: 'BTC', name: '比特币' },
      eth: { id: 'ethereum', symbol: 'ETH', name: '以太坊' },
      ethereum: { id: 'ethereum', symbol: 'ETH', name: '以太坊' },
      sol: { id: 'solana', symbol: 'SOL', name: 'Solana' },
      solana: { id: 'solana', symbol: 'SOL', name: 'Solana' },
      bnb: { id: 'binancecoin', symbol: 'BNB', name: '币安币' },
      xrp: { id: 'ripple', symbol: 'XRP', name: '瑞波币' },
      ada: { id: 'cardano', symbol: 'ADA', name: '艾达币' },
      doge: { id: 'dogecoin', symbol: 'DOGE', name: '狗狗币' },
      dot: { id: 'polkadot', symbol: 'DOT', name: '波卡币' },
      link: { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
     avax: { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
      matic: { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
      ltc: { id: 'litecoin', symbol: 'LTC', name: '莱特币' },
      atom: { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos' },
      usd: { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin' },
      usdt: { id: 'tether', symbol: 'USDT', name: 'Tether' },
    }

    if (arg === 'list' || !arg) {
      const popular = ['btc', 'eth', 'sol', 'bnb', 'xrp', 'doge', 'ada', 'dot', 'link', 'ltc']
      return {
        output: [
          '加密货币查询 (CoinGecko)',
          '',
          '支持的币种:',
          '',
          ...popular.map(s => {
            const c = coinMap[s]
            return `  ${c.symbol.padEnd(6)} ${c.name} (${c.id})`
          }),
          '',
          '用法: crypto <币种>',
          '      crypto list   查看支持列表',
          '',
          '示例:',
          '  crypto btc',
          '  crypto eth',
          '  crypto sol',
          '  crypto bitcoin',
        ].join('\n')
      }
    }

    const coin = coinMap[arg]
    if (!coin) {
      return {
        output: [
          `❌ 未知的币种: ${arg}`,
          '',
          '使用 "crypto list" 查看支持的币种',
        ].join('\n')
      }
    }

    const data = await fetchJson<Record<string, {
      usd: number
      usd_24h_change?: number
      usd_market_cap?: number
      usd_24h_vol?: number
    }>>(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}` +
      `&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    )

    if (!data || !data[coin.id]) {
      return {
        output: '❌ 行情数据获取失败，请稍后重试'
      }
    }

    const info = data[coin.id]
    const color = '\x1b[36m'
    const bold = '\x1b[1m'
    const green = '\x1b[32m'
    const red = '\x1b[31m'
    const yellow = '\x1b[33m'
    const reset = '\x1b[0m'

    const change24h = info.usd_24h_change
    const changeColor = change24h !== undefined
      ? (change24h >= 0 ? `${green}▲` : `${red}▼`)
      : ''
    const changeStr = change24h !== undefined ? `${changeColor} ${Math.abs(change24h).toFixed(2)}%${reset}` : 'N/A'

    const formatLarge = (v?: number) => {
      if (!v) return 'N/A'
      if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
      if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
      if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
      return `$${v.toFixed(2)}`
    }

    return {
      output: [
        `${bold}${color}╔══════════════════════════════════╗${reset}`,
        `${bold}${color}║       加密货币行情               ║${reset}`,
        `${bold}${color}╚══════════════════════════════════╝${reset}`,
        '',
        `${bold}币种:${reset}   ${coin.name} (${coin.symbol})`,
        `${bold}价格:${reset}   ${yellow}$${info.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `${bold}24h涨跌:${reset} ${changeStr}`,
        `${bold}市值:${reset}   ${formatLarge(info.usd_market_cap)}`,
        `${bold}24h成交额:${reset} ${formatLarge(info.usd_24h_vol)}`,
        '',
        `数据来源: CoinGecko · ${new Date().toLocaleString('zh-CN')}`,
      ].join('\n')
    }
  },
  description: '查询加密货币实时价格 (CoinGecko)',
  usage: 'crypto <币种>',
  examples: ['crypto btc', 'crypto eth', 'crypto sol']
})

// ── joke ─────────────────────────────────────────────────
registerCommand('joke', {
  handler: (): CommandResult => {
    const jokes = [
      {
        setup: '为什么程序员喜欢暗色主题？',
        punchline: '因为 bug 都怕光。'
      },
      {
        setup: '程序员的妻子让他去商店：',
        punchline: '"买一瓶牛奶，如果有鸡蛋就买两打。" 程序员回家时买了24瓶牛奶。'
      },
      {
        setup: '世界上只有10种人：',
        punchline: '懂二进制的和不懂二进制的。'
      },
      {
        setup: 'SQL 查询走进酒吧，',
        punchline: '看见两张桌子，问道："我能加入你们吗？"'
      },
      {
        setup: '为什么 Java 开发者戴眼镜？',
        punchline: '因为他们不 C#。'
      },
      {
        setup: '一个程序员走进酒吧，点了一杯啤酒。',
        punchline: '又点了一杯，然后第三杯。最后他调试了一下自己的行为。'
      },
      {
        setup: '世界上最遥远的距离是什么？',
        punchline: '不是生与死，而是你写的代码过不了编译。'
      },
      {
        setup: '程序员的三个谎言：',
        punchline: '"这很简单"、"马上就好"、"不会有bug的"'
      },
      {
        setup: '为什么前端开发者总是很悲观？',
        punchline: '因为他们总是面对 bug。'
      },
      {
        setup: '产品经理对程序员说：',
        punchline: '"这个功能应该很简单吧？" 程序员答："那你来做。"'
      },
      {
        setup: '如何区分前端和后端开发者？',
        punchline: '前端关心像素，后端关心毫秒。'
      },
      {
        setup: '程序员如何庆祝节日？',
        punchline: 'git commit -m "Merry Christmas" && git push'
      },
      {
        setup: '为什么程序员喜欢黑咖啡？',
        punchline: '因为它像他们的代码一样——苦且浓烈。'
      },
      {
        setup: '一个程序员打开冰箱，看见灯亮着，',
        punchline: '于是关上冰箱门，又打开，验证了三次。'
      },
      {
        setup: '你的代码和你有什么区别？',
        punchline: '你的代码在周五下午还能正常工作。'
      },
      {
        setup: '为什么程序员会搞混万圣节和圣诞节？',
        punchline: '因为 Oct 31 == Dec 25（八进制31 == 十进制25）'
      },
      {
        setup: '程序员的日常：',
        punchline: '早上: 喝咖啡 + 看报错。下午: 看报错 + 喝咖啡。'
      },
      {
        setup: '你听说过"代码异味"吗？',
        punchline: '那是代码审查时闻到的。'
      },
      {
        setup: '程序员最害怕的三个词：',
        punchline: '"生产环境"、"紧急修复"、"老板说"'
      },
      {
        setup: '为什么开发者喜欢 vim？',
        punchline: '因为退出 vim 本身就是一种成就。'
      },
    ]

    const joke = jokes[Math.floor(Math.random() * jokes.length)]

    const color = '\x1b[35m'
    const bold = '\x1b[1m'
    const yellow = '\x1b[33m'
    const reset = '\x1b[0m'

    return {
      output: [
        `${bold}${color}╔══════════════════════════════════╗${reset}`,
        `${bold}${color}║          编程笑话 😂             ║${reset}`,
        `${bold}${color}╚══════════════════════════════════╝${reset}`,
        '',
        `${bold}问:${reset} ${joke.setup}`,
        '',
        `${bold}${yellow}答:${reset} ${joke.punchline}`,
      ].join('\n')
    }
  },
  description: '显示一个编程笑话',
  usage: 'joke',
  examples: ['joke']
})

// ── app ───────────────────────────────────────────────────
registerCommand('app', {
  handler: (context: CommandContext): CommandResult => {
    const arg = (context.args[0] || '').toLowerCase().trim()

    const appList: Array<{ id: string; name: string; category: string; desc: string }> = [
      { id: 'terminal', name: '终端', category: 'system', desc: 'Linux 风格终端模拟器' },
      { id: 'files', name: '文件管理器', category: 'system', desc: '虚拟文件系统管理' },
      { id: 'browser', name: '浏览器', category: 'internet', desc: '内置网页浏览器' },
      { id: 'settings', name: '系统设置', category: 'system', desc: '主题/外观/账户设置' },
      { id: 'calculator', name: '计算器', category: 'utilities', desc: '科学计算器' },
      { id: 'text-editor', name: '文本编辑器', category: 'office', desc: '代码编辑器' },
      { id: 'code-editor', name: '代码编辑器', category: 'development', desc: '高级代码编辑器' },
      { id: 'music-player', name: '音乐播放器', category: 'multimedia', desc: '在线音乐播放' },
      { id: 'image-viewer', name: '图片查看器', category: 'multimedia', desc: '图片浏览与管理' },
      { id: 'paint', name: '画图', category: 'multimedia', desc: '简易绘图工具' },
      { id: 'notes', name: '记事本', category: 'office', desc: '快速笔记' },
      { id: 'calendar', name: '日历', category: 'office', desc: '日历与日程管理' },
      { id: 'weather', name: '天气', category: 'utilities', desc: '实时天气查询' },
      { id: 'system-monitor', name: '系统监控', category: 'system', desc: '系统资源监控' },
      { id: 'help', name: '帮助中心', category: 'system', desc: '使用指南' },
      { id: 'camera', name: '相机', category: 'multimedia', desc: '摄像头拍照' },
      { id: 'password-manager', name: '密码管理器', category: 'utilities', desc: '安全密码存储' },
      { id: 'smart-workspace', name: '智能工作空间', category: 'utilities', desc: '多布局工作空间' },
      { id: 'smart-dashboard', name: '智能仪表板', category: 'utilities', desc: '信息聚合中心' },
      { id: 'studio-suite', name: '创意工作室', category: 'multimedia', desc: '设计工具箱' },
      { id: 'neofetch-system', name: '系统信息', category: 'system', desc: 'neofetch 风格系统信息' },
      { id: 'research-assistant', name: 'AI研究助手', category: 'utilities', desc: '学术论文搜索' },
      { id: 'wiki-explorer', name: '维基探索', category: 'internet', desc: 'Wikipedia 探索' },
      { id: 'markdown-slides-pro', name: 'Markdown 演示', category: 'office', desc: 'MD 转幻灯片' },
      { id: 'ai-image-studio', name: 'AI图像工作室', category: 'multimedia', desc: 'AI 图像生成' },
      { id: 'open-source-hub', name: '开源导航', category: 'internet', desc: 'GitHub 项目探索' },
    ]

    if (arg === 'list' || !arg) {
      const color = '\x1b[36m'
      const bold = '\x1b[1m'
      const reset = '\x1b[0m'

      const byCategory: Record<string, typeof appList> = {}
      for (const a of appList) {
        const cat = a.category
        if (!byCategory[cat]) byCategory[cat] = []
        byCategory[cat].push(a)
      }

      const categoryNames: Record<string, string> = {
        system: '系统',
        internet: '网络',
        utilities: '实用工具',
        office: '办公',
        multimedia: '多媒体',
        development: '开发',
        games: '游戏',
      }

      const lines: string[] = []
      lines.push(`${bold}${color}╔══════════════════════════════════════════════╗${reset}`)
      lines.push(`${bold}${color}║         可用应用列表                         ║${reset}`)
      lines.push(`${bold}${color}╚══════════════════════════════════════════════╝${reset}`)
      lines.push('')

      for (const [cat, apps] of Object.entries(byCategory)) {
        lines.push(`${bold}${categoryNames[cat] || cat}:${reset}`)
        for (const a of apps) {
          lines.push(`  ${a.id.padEnd(24)} ${a.name} — ${a.desc}`)
        }
        lines.push('')
      }

      lines.push(`共 ${appList.length} 个应用`)
      lines.push('')
      lines.push('用法: app <应用ID>        打开指定应用')
      lines.push('      app list            列出所有应用')
      lines.push('')
      lines.push('示例: app terminal')
      lines.push('      app browser')

      return { output: lines.join('\n') }
    }

    const app = appList.find(a => a.id === arg)
    if (!app) {
      return {
        output: [
          `❌ 未找到应用: ${arg}`,
          '',
          '使用 "app list" 查看所有可用应用',
        ].join('\n')
      }
    }

    if (!context.openApp) {
      return {
        output: '❌ 应用打开功能不可用 (openApp 未初始化)'
      }
    }

    try {
      context.openApp(app.id)
      return {
        output: [
          `✅ 正在打开: ${app.name}`,
          `   ID: ${app.id}`,
          `   描述: ${app.desc}`,
        ].join('\n')
      }
    } catch (err) {
      return {
        output: `❌ 打开应用失败: ${err instanceof Error ? err.message : String(err)}`
      }
    }
  },
  description: '列出可用应用或打开指定应用',
  usage: 'app [list|应用ID]',
  examples: ['app', 'app list', 'app terminal', 'app browser']
})

// ── shortcut ──────────────────────────────────────────────
registerCommand('shortcut', {
  handler: (): CommandResult => {
    const color = '\x1b[36m'
    const bold = '\x1b[1m'
    const green = '\x1b[32m'
    const yellow = '\x1b[33m'
    const reset = '\x1b[0m'

    const sections: Array<{ title: string; shortcuts: Array<{ keys: string; desc: string }> }> = [
      {
        title: '常用快捷键',
        shortcuts: [
          { keys: 'Ctrl+Shift+K', desc: '全局搜索' },
          { keys: 'Ctrl+Space', desc: '命令面板' },
          { keys: 'Ctrl+Shift+?', desc: '快捷键帮助' },
          { keys: 'Ctrl+A', desc: '快捷操作中心' },
          { keys: 'F11', desc: '全屏模式' },
          { keys: 'Ctrl+Alt+Tab', desc: '切换窗口' },
          { keys: 'Ctrl+Alt+Shift+Tab', desc: '反向切换窗口' },
          { keys: 'Ctrl+Q', desc: '关闭当前窗口' },
          { keys: 'Ctrl+M', desc: '最小化窗口' },
          { keys: 'Ctrl+L', desc: '锁屏' },
        ]
      },
      {
        title: '应用快捷键',
        shortcuts: [
          { keys: 'Ctrl+T', desc: '打开终端' },
          { keys: 'Ctrl+E', desc: '打开文件管理器' },
          { keys: 'Ctrl+B', desc: '打开浏览器' },
          { keys: 'Ctrl+,', desc: '打开设置' },
          { keys: 'Ctrl+H', desc: '打开帮助' },
          { keys: 'Ctrl+Shift+E', desc: '打开文本编辑器' },
          { keys: 'Ctrl+Shift+C', desc: '打开计算器' },
          { keys: 'Ctrl+Shift+M', desc: '打开音乐播放器' },
          { keys: 'Ctrl+Shift+W', desc: '打开天气' },
          { keys: 'Ctrl+S', desc: '打开系统监控' },
          { keys: 'Ctrl+G', desc: '打开代码编辑器' },
          { keys: 'Ctrl+I', desc: '打开图片查看器' },
          { keys: 'Ctrl+Alt+N', desc: '打开记事本' },
          { keys: 'Ctrl+Shift+D', desc: '打开日历' },
          { keys: 'Ctrl+Shift+U', desc: '打开创意工作室' },
        ]
      },
      {
        title: '终端快捷键',
        shortcuts: [
          { keys: 'Ctrl+L', desc: '清除屏幕' },
          { keys: 'Ctrl+C', desc: '取消当前命令' },
          { keys: 'Ctrl+D', desc: '关闭终端' },
          { keys: 'Tab', desc: '自动补全' },
          { keys: '↑ / ↓', desc: '浏览历史命令' },
          { keys: 'Ctrl+R', desc: '搜索历史命令' },
          { keys: 'Ctrl+A', desc: '光标移到行首' },
          { keys: 'Ctrl+E', desc: '光标移到行尾' },
          { keys: 'Ctrl+U', desc: '删除到行首' },
          { keys: 'Ctrl+K', desc: '删除到行尾' },
          { keys: 'Ctrl+W', desc: '删除前一个词' },
          { keys: 'Ctrl+Alt+N', desc: '新开终端窗口' },
        ]
      },
    ]

    const lines: string[] = []
    lines.push(`${bold}${color}╔══════════════════════════════════════════════╗${reset}`)
    lines.push(`${bold}${color}║           键盘快捷键速查                      ║${reset}`)
    lines.push(`${bold}${color}╚══════════════════════════════════════════════╝${reset}`)
    lines.push('')

    for (const section of sections) {
      lines.push(`${bold}${green}── ${section.title} ──${reset}`)
      for (const s of section.shortcuts) {
        lines.push(`  ${yellow}${s.keys.padEnd(22)}${reset} ${s.desc}`)
      }
      lines.push('')
    }

    lines.push(`提示: 按 ${bold}Ctrl+Shift+?${reset} 随时打开此面板`)
    lines.push('      按 F11 进入全屏模式获得最佳体验')

    return { output: lines.join('\n') }
  },
  description: '显示系统快捷键帮助',
  usage: 'shortcut',
  examples: ['shortcut']
})
