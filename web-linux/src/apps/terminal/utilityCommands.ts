import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

const apiCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 60000

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = apiCache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = await response.json()
  apiCache.set(url, { data, timestamp: Date.now() })
  return data
}

registerCommand('base64-encode', {
  handler: (context: CommandContext): CommandResult => {
    if (context.args.length === 0) {
      return {
        output: '用法: base64-encode <文本>\n示例: base64-encode "hello world"'
      }
    }

    const text = context.args.join(' ')
    const encoded = btoa(unescape(encodeURIComponent(text)))

    return {
      output: `Base64编码结果:\n\n${encoded}`
    }
  },
  description: 'Base64编码',
  usage: 'base64-encode <文本>',
  examples: ['base64-encode "hello world"']
})

registerCommand('base64-decode', {
  handler: (context: CommandContext): CommandResult => {
    if (context.args.length === 0) {
      return {
        output: '用法: base64-decode <Base64字符串>\n示例: base64-decode aGVsbG8gd29ybGQ='
      }
    }

    try {
      const encoded = context.args.join(' ')
      const decoded = decodeURIComponent(escape(atob(encoded)))

      return {
        output: `Base64解码结果:\n\n${decoded}`
      }
    } catch (error) {
      return {
        output: `Base64解码失败: ${error instanceof Error ? error.message : '无效的Base64字符串'}`
      }
    }
  },
  description: 'Base64解码',
  usage: 'base64-decode <Base64字符串>',
  examples: ['base64-decode aGVsbG8gd29ybGQ=']
})

registerCommand('hash-md5', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    if (context.args.length === 0) {
      return {
        output: '用法: hash-md5 <文本>\n示例: hash-md5 "hello world"'
      }
    }

    const text = context.args.join(' ')
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('MD5', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return {
      output: `MD5哈希值:\n\n${hashHex}`
    }
  },
  description: '计算MD5哈希值',
  usage: 'hash-md5 <文本>',
  examples: ['hash-md5 "hello world"']
})

registerCommand('hash-sha256', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    if (context.args.length === 0) {
      return {
        output: '用法: hash-sha256 <文本>\n示例: hash-sha256 "hello world"'
      }
    }

    const text = context.args.join(' ')
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return {
      output: `SHA-256哈希值:\n\n${hashHex}`
    }
  },
  description: '计算SHA-256哈希值',
  usage: 'hash-sha256 <文本>',
  examples: ['hash-sha256 "hello world"']
})

registerCommand('password-gen', {
  handler: (context: CommandContext): CommandResult => {
    const length = Math.min(128, Math.max(8, parseInt(context.args[0]) || 16))
    const options = {
      uppercase: !context.args.includes('--no-upper'),
      lowercase: !context.args.includes('--no-lower'),
      numbers: !context.args.includes('--no-numbers'),
      symbols: !context.args.includes('--no-symbols')
    }

    let charset = ''
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (options.numbers) charset += '0123456789'
    if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (!charset) {
      return {
        output: '错误: 至少需要一种字符类型'
      }
    }

    let password = ''
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)

    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length]
    }

    const strength = length >= 16 ? '强' : length >= 12 ? '中等' : '弱'

    return {
      output: `生成密码 (长度: ${length}, 强度: ${strength}):\n\n${password}\n\n选项: --no-upper, --no-lower, --no-numbers, --no-symbols`
    }
  },
  description: '生成随机密码',
  usage: 'password-gen [长度] [选项]',
  examples: ['password-gen', 'password-gen 20', 'password-gen 16 --no-symbols']
})

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    if (context.args.length === 0) {
      return {
        output: '用法: weather <城市名>\n示例: weather Beijing'
      }
    }

    try {
      const city = context.args.join(' ')
      const geoData = await fetchWithCache<any[]>(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      )

      if (!geoData || geoData.length === 0) {
        return {
          output: `未找到城市: ${city}`
        }
      }

      const { latitude, longitude, name: cityName, country } = geoData[0]
      const weatherData = await fetchWithCache<any>(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`
      )

      const current = weatherData.current_weather
      const temp = current.temperature
      const windSpeed = current.windspeed
      const weatherCode = current.weathercode

      const weatherDesc: Record<number, string> = {
        0: '晴朗',
        1: '大部晴朗',
        2: '局部多云',
        3: '多云',
        45: '雾',
        48: '雾',
        51: '细雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        95: '雷暴',
      }

      const desc = weatherDesc[weatherCode] || `天气代码 ${weatherCode}`

      return {
        output: `${cityName}, ${country}\n\n温度: ${temp}°C\n风速: ${windSpeed} km/h\n天气: ${desc}\n\n数据来源: Open-Meteo`
      }
    } catch (error) {
      return {
        output: `获取天气失败: ${error instanceof Error ? error.message : '网络错误'}`
      }
    }
  },
  description: '查询实时天气',
  usage: 'weather <城市名>',
  examples: ['weather Beijing', 'weather Tokyo']
})

registerCommand('timezone', {
  handler: (): CommandResult => {
    const timezones = [
      { name: '北京', tz: 'Asia/Shanghai', offset: '+08:00' },
      { name: '东京', tz: 'Asia/Tokyo', offset: '+09:00' },
      { name: '纽约', tz: 'America/New_York', offset: '-04:00' },
      { name: '伦敦', tz: 'Europe/London', offset: '+01:00' },
      { name: '巴黎', tz: 'Europe/Paris', offset: '+02:00' },
      { name: '悉尼', tz: 'Australia/Sydney', offset: '+10:00' },
      { name: '迪拜', tz: 'Asia/Dubai', offset: '+04:00' },
      { name: '新加坡', tz: 'Asia/Singapore', offset: '+08:00' },
    ]

    const now = new Date()
    const lines = timezones.map(tz => {
      const time = now.toLocaleString('zh-CN', { timeZone: tz.tz })
      return `  ${tz.name.padEnd(6)} ${tz.offset.padEnd(7)} ${time}`
    })

    return {
      output: `全球时区时间:\n\n${lines.join('\n')}`
    }
  },
  description: '显示全球主要城市时区时间',
  usage: 'timezone',
  examples: ['timezone']
})

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache<any>(
        'https://open.er-api.com/v6/latest/USD'
      )

      if (context.args.length === 0) {
        const rates = data.rates
        const mainCurrencies = ['CNY', 'EUR', 'GBP', 'JPY', 'KRW', 'HKD', 'SGD']
        const lines = mainCurrencies.map(code => {
          const rate = rates[code]
          return `  USD → ${code}: ${rate.toFixed(4)}`
        })

        return {
          output: `USD 汇率 (更新: ${new Date(data.time_last_update_utc).toLocaleString('zh-CN')}):\n${lines.join('\n')}`
        }
      }

      const from = context.args[0]?.toUpperCase() || 'USD'
      const to = context.args[1]?.toUpperCase() || 'CNY'
      const amount = parseFloat(context.args[2]) || 1

      if (!data.rates[from] || !data.rates[to]) {
        return {
          output: `不支持的货币: ${from} 或 ${to}`
        }
      }

      const fromRate = from === 'USD' ? 1 : data.rates[from]
      const toRate = data.rates[to]
      const result = (amount / fromRate) * toRate

      return {
        output: `${amount} ${from} = ${result.toFixed(2)} ${to}\n汇率: 1 ${from} = ${(toRate / fromRate).toFixed(4)} ${to}`
      }
    } catch (error) {
      return {
        output: `获取汇率失败: ${error instanceof Error ? error.message : '网络错误'}`
      }
    }
  },
  description: '汇率查询',
  usage: 'currency [from] [to] [amount]',
  examples: ['currency', 'currency USD CNY', 'currency USD CNY 100']
})