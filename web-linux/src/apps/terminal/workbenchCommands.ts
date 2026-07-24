import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

function formatNumber(num: number, decimals = 2): string {
  return Number(num.toFixed(decimals)).toString()
}

function getTimeInfo(): string {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false })
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const timestamp = Math.floor(now.getTime() / 1000)

  return `现在时间: ${timeStr}
日期: ${dateStr}
Unix 时间戳: ${timestamp}
时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
`
}

registerCommand('workbench', {
  handler: (): CommandResult => {
    const output = `
╔══════════════════════════════════════════════════════════════╗
║                   🚀 智能工作台 Quick Start                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  打开智能工作台:  在启动器搜索 "智能工作台" 或点击桌面图标    ║
║                                                              ║
║  功能概览:                                                   ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  快捷工具区    8个常用应用一键直达                        │  ║
║  │  系统状态      CPU/内存/网络/存储实时监控                │  ║
║  │  专注计时器    番茄工作法，提升效率                      │  ║
║  │  分类导航      6大分类，36+精选应用                      │  ║
║  │  全局搜索      快速定位应用、命令、文件                  │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  快捷键:                                                     ║
║    Ctrl+K  全局搜索                                          ║
║    Ctrl+P  命令面板                                          ║
║    Ctrl+A  快捷操作中心                                      ║
║    Ctrl+T  打开终端                                          ║
║    Ctrl+E  打开文件管理器                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

提示: 输入 "help" 查看所有命令，输入 "apps" 浏览应用列表
`
    return { output }
  },
  description: '显示智能工作台使用指南',
  usage: 'workbench',
  examples: ['workbench'],
}, { source: 'workbenchCommands' })

registerCommand('now', {
  handler: (): CommandResult => {
    return { output: getTimeInfo() }
  },
  description: '显示当前时间、日期和时间戳',
  usage: 'now',
  examples: ['now'],
}, { source: 'workbenchCommands' })

registerCommand('focus', {
  handler: (ctx: CommandContext): CommandResult => {
    const minutes = ctx.args[0] ? parseInt(ctx.args[0]) : 25
    if (isNaN(minutes) || minutes <= 0 || minutes > 120) {
      return { output: `错误: 请输入 1-120 之间的分钟数\n用法: focus [分钟数]` }
    }

    const endTime = new Date(Date.now() + minutes * 60 * 1000)
    const endTimeStr = endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    const output = `
🍅 专注模式已启动
━━━━━━━━━━━━━━━━━━━━━━━━━━
  专注时长: ${minutes} 分钟
  结束时间: ${endTimeStr}
━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 专注小技巧:
  • 关闭无关的浏览器标签页
  • 将手机调至静音
  • 准备好所需的资料
  • 深呼吸，开始工作

提示: 专注结束后可输入 "break" 休息一下
`
    return { output }
  },
  description: '启动专注计时器（番茄工作法）',
  usage: 'focus [分钟数]',
  examples: ['focus', 'focus 45', 'focus 60'],
}, { source: 'workbenchCommands' })

registerCommand('break', {
  handler: (ctx: CommandContext): CommandResult => {
    const minutes = ctx.args[0] ? parseInt(ctx.args[0]) : 5
    if (isNaN(minutes) || minutes <= 0 || minutes > 60) {
      return { output: `错误: 请输入 1-60 之间的分钟数\n用法: break [分钟数]` }
    }

    const tips = [
      '站起来活动一下身体',
      '喝杯水，补充水分',
      '看看远处，放松眼睛',
      '做几个深呼吸',
      '伸展一下肩膀和脖子',
      '听一首喜欢的歌',
    ]
    const tip = tips[Math.floor(Math.random() * tips.length)]

    const output = `
☕ 休息时间到！
━━━━━━━━━━━━━━━━━━━━━━━━━━
  休息时长: ${minutes} 分钟
  建议: ${tip}
━━━━━━━━━━━━━━━━━━━━━━━━━━

记住: 适当的休息能提高整体效率
`
    return { output }
  },
  description: '休息计时器',
  usage: 'break [分钟数]',
  examples: ['break', 'break 10'],
}, { source: 'workbenchCommands' })

registerCommand('motivate', {
  handler: (): CommandResult => {
    const quotes = [
      '"每一行代码都是通往未来的阶梯"',
      '"今天的努力，是明天的底气"',
      '"保持好奇心，世界因你而不同"',
      '"专注当下，未来可期"',
      '"代码改变世界，你改变代码"',
      '"每一次调试，都是成长的机会"',
      '"简单的事情重复做，重复的事情用心做"',
      '"优秀是一种习惯，不是一次行动"',
      '"种一棵树最好的时间是十年前，其次是现在"',
      '"你的潜力，远比你想象的更大"',
      '"慢慢来，比较快"',
      '"每一个不曾起舞的日子，都是对生命的辜负"',
    ]
    const quote = quotes[Math.floor(Math.random() * quotes.length)]

    const output = `
✨ 今日激励
━━━━━━━━━━━━━━━━━━━━━━━━━━

  ${quote}

━━━━━━━━━━━━━━━━━━━━━━━━━━
  继续加油！你做得很棒 💪
`
    return { output }
  },
  description: '显示一句励志名言',
  usage: 'motivate',
  examples: ['motivate'],
}, { source: 'workbenchCommands' })

registerCommand('sysinfo', {
  handler: (): CommandResult => {
    const nav = navigator
    const perf = performance
    const memory = (perf as any).memory

    const cpuCores = nav.hardwareConcurrency || '未知'
    const platform = nav.platform || '未知'
    const language = nav.language
    const online = nav.onLine ? '在线 ✓' : '离线 ✗'
    const userAgent = nav.userAgent.split(' ').slice(-2).join(' ')

    let memoryInfo = '不可用'
    if (memory) {
      const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
      const total = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)
      memoryInfo = `${used} MB / ${total} MB`
    }

    const screenW = window.screen.width
    const screenH = window.screen.height
    const colorDepth = window.screen.colorDepth

    const output = `
🖥️  系统信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  浏览器:        ${userAgent}
  平台:          ${platform}
  CPU 核心数:    ${cpuCores}
  语言:          ${language}
  网络状态:      ${online}
  内存使用:      ${memoryInfo}
  屏幕分辨率:    ${screenW} x ${screenH}
  颜色深度:      ${colorDepth} bit
  WebGL 支持:    ${typeof WebGLRenderingContext !== 'undefined' ? '是 ✓' : '否 ✗'}
  Service Worker:${'serviceWorker' in navigator ? '支持 ✓' : '不支持 ✗'}
  本地存储:      ${typeof Storage !== 'undefined' ? '可用 ✓' : '不可用 ✗'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    return { output }
  },
  description: '显示详细的系统和浏览器信息',
  usage: 'sysinfo',
  examples: ['sysinfo'],
}, { source: 'workbenchCommands' })

registerCommand('uuid-gen', {
  handler: (ctx: CommandContext): CommandResult => {
    const count = ctx.args[0] ? Math.min(parseInt(ctx.args[0]), 50) : 1
    if (isNaN(count) || count <= 0) {
      return { output: '错误: 请输入有效的数量 (1-50)\n用法: uuid-gen [数量]' }
    }

    const uuids: string[] = []
    for (let i = 0; i < count; i++) {
      if (crypto.randomUUID) {
        uuids.push(crypto.randomUUID())
      } else {
        const hex = (n: number) => Array.from({ length: n }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('')
        uuids.push(
          `${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${hex(3)}-${hex(12)}`
        )
      }
    }

    return { output: uuids.join('\n') }
  },
  description: '生成 UUID (v4)',
  usage: 'uuid-gen [数量]',
  examples: ['uuid-gen', 'uuid-gen 5'],
}, { source: 'workbenchCommands' })

registerCommand('password', {
  handler: (ctx: CommandContext): CommandResult => {
    const length = ctx.args[0] ? Math.min(parseInt(ctx.args[0]), 128) : 16
    if (isNaN(length) || length < 4 || length > 128) {
      return { output: '错误: 密码长度需在 4-128 之间\n用法: password [长度]' }
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    let password = ''
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length]
    }

    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)
    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

    const strengthLabel = ['很弱', '较弱', '中等', '较强', '很强'][strength]
    const strengthBar = '█'.repeat(strength) + '░'.repeat(4 - strength)

    const output = `
🔐 生成的密码
━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${password}
━━━━━━━━━━━━━━━━━━━━━━━━━━
  长度: ${length} 位
  强度: ${strengthBar} ${strengthLabel}
  大写字母: ${hasUpper ? '✓' : '✗'}
  小写字母: ${hasLower ? '✓' : '✗'}
  数字:     ${hasNumber ? '✓' : '✗'}
  特殊符号: ${hasSpecial ? '✓' : '✗'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️  请妥善保管密码
`
    return { output }
  },
  description: '生成随机安全密码',
  usage: 'password [长度]',
  examples: ['password', 'password 32'],
}, { source: 'workbenchCommands' })

registerCommand('b64', {
  handler: (ctx: CommandContext): CommandResult => {
    const action = ctx.args[0]
    const text = ctx.args.slice(1).join(' ')

    if (!action || !text) {
      return {
        output: `用法: b64 <encode|decode> <文本>

示例:
  b64 encode hello world
  b64 decode aGVsbG8gd29ybGQ=`
      }
    }

    try {
      if (action === 'encode' || action === 'enc') {
        const encoded = btoa(unescape(encodeURIComponent(text)))
        return { output: encoded }
      } else if (action === 'decode' || action === 'dec') {
        const decoded = decodeURIComponent(escape(atob(text)))
        return { output: decoded }
      } else {
        return { output: `错误: 未知操作 "${action}"\n请使用 encode 或 decode` }
      }
    } catch (e) {
      return { output: `错误: ${e instanceof Error ? e.message : '操作失败'}` }
    }
  },
  description: 'Base64 编码/解码',
  usage: 'b64 <encode|decode> <文本>',
  examples: ['b64 encode hello', 'b64 decode aGVsbG8='],
}, { source: 'workbenchCommands' })

registerCommand('color', {
  handler: (ctx: CommandContext): CommandResult => {
    const input = ctx.args[0]
    if (!input) {
      const colors = [
        { name: '主色调', hex: '#7c6cf0' },
        { name: '次色调', hex: '#00d6c1' },
        { name: '成功色', hex: '#10b981' },
        { name: '警告色', hex: '#f59e0b' },
        { name: '错误色', hex: '#ef4444' },
        { name: '信息色', hex: '#3b82f6' },
      ]
      const output = colors.map(c => `  ${c.hex}  ${c.name}`).join('\n')
      return { output: `\n🎨 WebLinuxOS 配色方案\n━━━━━━━━━━━━━━━━━━━━\n${output}\n━━━━━━━━━━━━━━━━━━━━\n\n提示: 输入 "color #ff0000" 查看颜色详情\n` }
    }

    let hex = input.startsWith('#') ? input.slice(1) : input
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
    }
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return { output: '错误: 请输入有效的 HEX 颜色值\n示例: color #ff5500' }
    }

    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16
    )
    const b = parseInt(hex.slice(4, 6), 16)

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const brightness = luminance > 0.5 ? '亮色' : '暗色'

    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
    const complement = `#${toHex(255 - r)}${toHex(255 - g)}${toHex(255 - b)}`

    const output = `
🎨 颜色信息: #${hex}
━━━━━━━━━━━━━━━━━━━━━━━━━━
  RGB:   rgb(${r}, ${g}, ${b})
  HEX:   #${hex}
  亮度:  ${brightness} (${(luminance * 100).toFixed(1)}%)
  补色:  ${complement}
━━━━━━━━━━━━━━━━━━━━━━━━━━
  R: ${r.toString().padStart(3)}  ${'█'.repeat(Math.round(r / 16))}${'░'.repeat(16 - Math.round(r / 16))}
  G: ${g.toString().padStart(3)}  ${'█'.repeat(Math.round(g / 16))}${'░'.repeat(16 - Math.round(g / 16))}
  B: ${b.toString().padStart(3)}  ${'█'.repeat(Math.round(b / 16))}${'░'.repeat(16 - Math.round(b / 16))}
━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    return { output }
  },
  description: '颜色信息查询 (HEX/RGB/亮度/补色)',
  usage: 'color [HEX颜色值]',
  examples: ['color', 'color #ff5500', 'color 00d6c1'],
}, { source: 'workbenchCommands' })

registerCommand('weather-cli', {
  handler: async (ctx: CommandContext): Promise<CommandResult> => {
    const city = ctx.args.join(' ') || '北京'

    const cities: Record<string, { lat: number; lon: number; name: string }> = {
      '北京': { lat: 39.9042, lon: 116.4074, name: '北京' },
      '上海': { lat: 31.2304, lon: 121.4737, name: '上海' },
      '深圳': { lat: 22.5431, lon: 114.0579, name: '深圳' },
      '广州': { lat: 23.1291, lon: 113.2644, name: '广州' },
      '杭州': { lat: 30.2741, lon: 120.1551, name: '杭州' },
      '成都': { lat: 30.5728, lon: 104.0668, name: '成都' },
      '东京': { lat: 35.6762, lon: 139.6503, name: '东京' },
      '纽约': { lat: 40.7128, lon: -74.0060, name: '纽约' },
      '伦敦': { lat: 51.5074, lon: -0.1278, name: '伦敦' },
    }

    const cityInfo = cities[city] || cities['北京']

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
      const res = await fetch(url)
      const data = await res.json()

      const current = data.current
      const temp = current.temperature_2m
      const feelsLike = current.apparent_temperature
      const humidity = current.relative_humidity_2m
      const windSpeed = current.wind_speed_10m
      const weatherCode = current.weather_code

      const weatherEmojis: Record<number, string> = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌧️', 55: '🌧️',
        61: '🌧️', 63: '🌧️', 65: '🌧️',
        71: '🌨️', 73: '❄️', 75: '❄️',
        80: '🌦️', 81: '🌧️', 82: '⛈️',
        95: '⛈️', 96: '⛈️', 99: '⛈️',
      }

      const weatherNames: Record<number, string> = {
        0: '晴', 1: '大部晴朗', 2: '局部多云', 3: '阴',
        45: '雾', 48: '雾凇',
        51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        80: '阵雨', 81: '中阵雨', 82: '大阵雨',
        95: '雷暴', 96: '雷暴伴小冰雹', 99: '雷暴伴大冰雹',
      }

      const emoji = weatherEmojis[weatherCode] || '🌡️'
      const weatherName = weatherNames[weatherCode] || `代码 ${weatherCode}`

      const output = `
${emoji}  ${cityInfo.name} 天气
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  温度:     ${temp}°C  (体感 ${feelsLike}°C)
  天气:     ${weatherName}
  湿度:     ${humidity}%
  风速:     ${windSpeed} km/h
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  数据来源: Open-Meteo API
  更新时间: ${new Date().toLocaleTimeString('zh-CN')}
`
      return { output }
    } catch {
      const fallbackTemp = Math.round(Math.random() * 20 + 10)
      const output = `
🌡️  ${cityInfo.name} 天气 (模拟数据)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  温度:     ${fallbackTemp}°C
  天气:     多云
  湿度:     ${60 + Math.floor(Math.random() * 20)}%
  风速:     ${Math.floor(Math.random() * 20)} km/h
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️  网络不可用，显示模拟数据
`
      return { output }
    }
  },
  description: '查询天气 (支持国内主要城市)',
  usage: 'weather-cli [城市名]',
  examples: ['weather-cli', 'weather-cli 上海', 'weather-cli 东京'],
}, { source: 'workbenchCommands' })

registerCommand('calc', {
  handler: (ctx: CommandContext): CommandResult => {
    const expression = ctx.args.join('')
    if (!expression) {
      return {
        output: `用法: calc <表达式>

支持的运算:
  + - * / % ^  加、减、乘、除、取余、幂
  括号:        ( )

支持的函数:
  sqrt, sin, cos, tan, log, log10,
  abs, ceil, floor, round, exp, pow, min, max, sign

支持的常量:
  PI, E

示例:
  calc 2+3*4
  calc sqrt(256)
  calc sin(PI/2)
  calc pow(2, 10)`
      }
    }

    try {
      const FUNCTIONS: Record<string, (...args: number[]) => number> = {
        sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
        log: Math.log, log10: Math.log10, abs: Math.abs,
        ceil: Math.ceil, floor: Math.floor, round: Math.round,
        exp: Math.exp, pow: Math.pow, min: Math.min, max: Math.max,
        sign: Math.sign,
      }
      const CONSTANTS: Record<string, number> = { PI: Math.PI, E: Math.E }

      const tokens: Array<{ type: string; value: string }> = []
      let i = 0
      const expr = expression.replace(/\s/g, '')

      while (i < expr.length) {
        const ch = expr[i]
        if (/[0-9.]/.test(ch)) {
          let num = ''
          while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i++]; }
          tokens.push({ type: 'num', value: num })
        } else if (/[a-zA-Z_]/.test(ch)) {
          let word = ''
          while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) { word += expr[i++]; }
          if (word in CONSTANTS) { tokens.push({ type: 'num', value: String(CONSTANTS[word]) }) }
          else if (word.toLowerCase() in FUNCTIONS) { tokens.push({ type: 'func', value: word.toLowerCase() }) }
          else { throw new Error(`未知标识符: ${word}`) }
        } else if ('+-*/%^(),'.includes(ch)) {
          tokens.push({ type: 'op', value: ch }); i++
        } else {
          throw new Error(`无效字符: ${ch}`)
        }
      }

      let pos = 0
      const peek = () => tokens[pos]
      const eat = (type: string, value?: string) => {
        const t = tokens[pos]
        if (!t || t.type !== type || (value && t.value !== value)) {
          throw new Error(`语法错误: 期望 ${value || type}`)
        }
        pos++
        return t
      }

      const parseExpr = (): number => {
        let val = parseTerm()
        while (peek() && (peek()!.value === '+' || peek()!.value === '-')) {
          const op = eat('op').value
          const right = parseTerm()
          val = op === '+' ? val + right : val - right
        }
        return val
      }

      const parseTerm = (): number => {
        let val = parseFactor()
        while (peek() && (peek()!.value === '*' || peek()!.value === '/' || peek()!.value === '%')) {
          const op = eat('op').value
          const right = parseFactor()
          if (op === '*') val *= right
          else if (op === '/') { if (right === 0) throw new Error('除零错误'); val /= right }
          else val %= right
        }
        return val
      }

      const parseFactor = (): number => {
        let val = parsePower()
        return val
      }

      const parsePower = (): number => {
        const base = parseUnary()
        if (peek()?.value === '^') {
          eat('op')
          const exp = parsePower()
          return Math.pow(base, exp)
        }
        return base
      }

      const parseUnary = (): number => {
        if (peek()?.value === '+') { eat('op'); return parseUnary() }
        if (peek()?.value === '-') { eat('op'); return -parseUnary() }
        return parsePrimary()
      }

      const parsePrimary = (): number => {
        const t = peek()
        if (!t) throw new Error('意外的表达式结尾')

        if (t.type === 'num') {
          eat('num')
          const num = parseFloat(t.value)
          if (isNaN(num)) throw new Error(`无效数字: ${t.value}`)
          return num
        }

        if (t.type === 'func') {
          const funcName = eat('func').value
          eat('op', '(')
          const args: number[] = [parseExpr()]
          while (peek()?.value === ',') { eat('op'); args.push(parseExpr()) }
          eat('op', ')')
          const fn = FUNCTIONS[funcName]
          return fn(...args)
        }

        if (t.value === '(') {
          eat('op', '(')
          const val = parseExpr()
          eat('op', ')')
          return val
        }

        throw new Error(`意外的 token: ${t.value}`)
      }

      const result = parseExpr()
      if (pos < tokens.length) throw new Error('表达式有多余字符')

      return { output: `= ${formatNumber(result, 10)}` }
    } catch (e) {
      return { output: `错误: ${e instanceof Error ? e.message : '计算失败'}` }
    }
  },
  description: '科学计算器',
  usage: 'calc <表达式>',
  examples: ['calc 2+3*4', 'calc sqrt(256)', 'calc sin(PI/2)'],
}, { source: 'workbenchCommands' })
