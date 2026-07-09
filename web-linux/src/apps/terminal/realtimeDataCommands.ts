/**
 * 实时数据命令模块
 * 提供接入真实公开API的命令，让WebLinuxOS具有实际应用价值
 */

import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

// 缓存工具：避免频繁请求同一API
const apiCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 60000 // 1分钟缓存

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

// 注册命令：查询实时加密货币价格（CoinGecko免费API）
registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const coinId = context.args[0]?.toLowerCase() || 'bitcoin'
      const data = await fetchWithCache<any>(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      )

      if (!data[coinId]) {
        return {
          output: `未找到加密货币: ${coinId}\n支持的主要币种: bitcoin, ethereum, binancecoin, solana, cardano, polkadot`
        }
      }

      const price = data[coinId].usd
      const change = data[coinId].usd_24h_change
      const changeStr = change ? (change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`) : 'N/A'

      return {
        output: `${coinId.toUpperCase()} 实时价格:\n\n  💰 USD: $${price.toLocaleString()}\n  📈 24h: ${changeStr}\n\n数据来源: CoinGecko API`
      }
    } catch (error) {
      return {
        output: `获取加密货币价格失败: ${error instanceof Error ? error.message : '网络错误'}`
      }
    }
  },
  description: '查询加密货币实时价格（BTC/ETH/BNB等）',
  usage: 'crypto [coin]',
  examples: ['crypto', 'crypto bitcoin', 'crypto ethereum']
})

// 注册命令：查询实时天气（Open-Meteo免费API）
registerCommand('weather-live', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    if (context.args.length === 0) {
      return {
        output: '用法: weather-live <城市名>\n示例: weather-live Beijing'
      }
    }

    try {
      const city = context.args.join(' ')

      // 先获取城市坐标
      const geoData = await fetchWithCache<any[]>(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      )

      if (!geoData || geoData.length === 0) {
        return {
          output: `未找到城市: ${city}`
        }
      }

      const { latitude, longitude, name: cityName, country } = geoData[0]

      // 获取天气数据
      const weatherData = await fetchWithCache<any>(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`
      )

      const current = weatherData.current_weather
      const temp = current.temperature
      const windSpeed = current.windspeed
      const weatherCode = current.weathercode

      const weatherDesc: Record<number, string> = {
        0: '晴朗 ☀️',
        1: '大部晴朗 🌤️',
        2: '局部多云 ⛅',
        3: '多云 ☁️',
        45: '雾 🌫️',
        48: '雾 ❄️',
        51: '细雨 🌧️',
        61: '小雨 🌧️',
        63: '中雨 🌧️',
        65: '大雨 🌧️',
        71: '小雪 🌨️',
        73: '中雪 🌨️',
        75: '大雪 🌨️',
        95: '雷暴 ⛈️',
      }

      const desc = weatherDesc[weatherCode] || `天气代码 ${weatherCode}`

      return {
        output: `${cityName}, ${country} 实时天气:\n\n  🌡️ 温度: ${temp}°C\n  💨 风速: ${windSpeed} km/h\n  🌤️ 天气: ${desc}\n\n数据来源: Open-Meteo API`
      }
    } catch (error) {
      return {
        output: `获取天气失败: ${error instanceof Error ? error.message : '网络错误'}`
      }
    }
  },
  description: '查询全球城市实时天气',
  usage: 'weather-live <城市名>',
  examples: ['weather-live Beijing', 'weather-live Tokyo', 'weather-live "New York"']
})

// 注册命令：查询实时汇率（免费API）
registerCommand('exchange', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache<any>(
        'https://open.er-api.com/v6/latest/USD'
      )

      if (context.args.length === 0) {
        // 显示主要货币汇率
        const rates = data.rates
        const mainCurrencies = ['CNY', 'EUR', 'GBP', 'JPY', 'KRW', 'HKD', 'SGD']
        const lines = mainCurrencies.map(code => {
          const rate = rates[code]
          return `  USD → ${code}: ${rate.toFixed(4)}`
        })

        return {
          output: `USD 实时汇率 (更新时间: ${new Date(data.time_last_update_utc).toLocaleString('zh-CN')}):\n${lines.join('\n')}\n\n数据来源: Exchange Rate API`
        }
      }

      const from = context.args[0]?.toUpperCase() || 'USD'
      const to = context.args[1]?.toUpperCase() || 'CNY'
      const amount = parseFloat(context.args[2]) || 1

      if (!data.rates[from] || !data.rates[to]) {
        return {
          output: `不支持的货币代码: ${from} 或 ${to}`
        }
      }

      // 转换汇率
      const fromRate = from === 'USD' ? 1 : data.rates[from]
      const toRate = data.rates[to]
      const result = (amount / fromRate) * toRate

      return {
        output: `汇率转换:\n\n  ${amount} ${from} = ${result.toFixed(2)} ${to}\n  汇率: 1 ${from} = ${(toRate / fromRate).toFixed(4)} ${to}\n\n数据来源: Exchange Rate API`
      }
    } catch (error) {
      return {
        output: `获取汇率失败: ${error instanceof Error ? error.message : '网络错误'}`
      }
    }
  },
  description: '查询实时汇率',
  usage: 'exchange [from] [to] [amount]',
  examples: ['exchange', 'exchange USD CNY', 'exchange USD CNY 100']
})

// 注册命令：查询GitHub用户信息
registerCommand('github-user', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    if (context.args.length === 0) {
      return {
        output: '用法: github-user <用户名>'
      }
    }

    try {
      const username = context.args[0]
      const data = await fetchWithCache<any>(`https://api.github.com/users/${username}`)

      return {
        output: `GitHub 用户: ${data.login}\n\n  👤 名称: ${data.name || 'N/A'}\n  📝 简介: ${data.bio || 'N/A'}\n  📍 位置: ${data.location || 'N/A'}\n  🏢 公司: ${data.company || 'N/A'}\n  📦 仓库: ${data.public_repos}\n  👥 关注者: ${data.followers}\n  ➡️ 正在关注: ${data.following}\n  📅 注册时间: ${new Date(data.created_at).toLocaleDateString('zh-CN')}\n\n🔗 ${data.html_url}`
      }
    } catch (error) {
      return {
        output: `查询GitHub用户失败: ${error instanceof Error ? error.message : '网络错误'}`
      }
    }
  },
  description: '查询GitHub用户信息',
  usage: 'github-user <用户名>',
  examples: ['github-user torvalds', 'github-user gaearon']
})

// 注册命令：生成UUID
registerCommand('uuid-gen', {
  handler: (context: CommandContext): CommandResult => {
    const count = Math.min(10, Math.max(1, parseInt(context.args[0]) || 1))
    const uuids: string[] = []

    for (let i = 0; i < count; i++) {
      uuids.push('  ' + crypto.randomUUID())
    }

    return {
      output: `生成 ${count} 个 UUID (v4):\n${uuids.join('\n')}`
    }
  },
  description: '生成UUID（v4）',
  usage: 'uuid-gen [数量]',
  examples: ['uuid-gen', 'uuid-gen 5']
})

// 注册命令：快速HTTP状态码查询
registerCommand('http', {
  handler: (context: CommandContext): CommandResult => {
    const statusDescriptions: Record<number, string> = {
      100: 'Continue - 继续发送请求的剩余部分',
      101: 'Switching Protocols - 切换协议',
      200: 'OK - 请求成功',
      201: 'Created - 已创建新资源',
      202: 'Accepted - 已接受请求，但未处理完成',
      204: 'No Content - 成功，但无内容返回',
      301: 'Moved Permanently - 永久重定向',
      302: 'Found - 临时重定向',
      304: 'Not Modified - 资源未修改',
      400: 'Bad Request - 请求语法错误',
      401: 'Unauthorized - 需要身份认证',
      403: 'Forbidden - 拒绝访问',
      404: 'Not Found - 资源不存在',
      405: 'Method Not Allowed - 方法不允许',
      408: 'Request Timeout - 请求超时',
      409: 'Conflict - 请求冲突',
      410: 'Gone - 资源已删除',
      413: 'Payload Too Large - 请求体过大',
      414: 'URI Too Long - URI过长',
      429: 'Too Many Requests - 请求过多',
      500: 'Internal Server Error - 服务器内部错误',
      501: 'Not Implemented - 未实现',
      502: 'Bad Gateway - 网关错误',
      503: 'Service Unavailable - 服务不可用',
      504: 'Gateway Timeout - 网关超时',
    }

    if (context.args.length === 0) {
      const commonCodes = [200, 201, 301, 302, 400, 401, 403, 404, 500, 502, 503]
      const lines = commonCodes.map(code => `  ${code}: ${statusDescriptions[code].split(' - ')[0]}`)
      return {
        output: `常用HTTP状态码:\n${lines.join('\n')}\n\n使用 "http <状态码>" 查看详细信息`
      }
    }

    const code = parseInt(context.args[0])
    if (!statusDescriptions[code]) {
      return {
        output: `未知状态码: ${code}\n请输入有效HTTP状态码（100-599）`
      }
    }

    return {
      output: `HTTP ${code}: ${statusDescriptions[code]}`
    }
  },
  description: '查询HTTP状态码含义',
  usage: 'http <状态码>',
  examples: ['http 404', 'http 500', 'http 200']
})

// 注册命令：快速Unix时间戳转换
registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const now = Math.floor(Date.now() / 1000)

    if (context.args.length === 0) {
      const date = new Date()
      return {
        output: `当前时间:\n\n  🕐 Unix时间戳: ${now}\n  📅 ISO格式: ${date.toISOString()}\n  🌏 本地时间: ${date.toLocaleString('zh-CN')}\n  🌐 UTC时间: ${date.toUTCString()}`
      }
    }

    const input = context.args[0]

    // 判断是时间戳还是日期字符串
    if (/^\d+$/.test(input)) {
      const timestamp = parseInt(input)
      const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp
      const date = new Date(ms)

      return {
        output: `时间戳 ${input}:\n\n  📅 ISO格式: ${date.toISOString()}\n  🌏 本地时间: ${date.toLocaleString('zh-CN')}\n  🌐 UTC时间: ${date.toUTCString()}`
      }
    } else {
      // 尝试解析日期字符串
      const date = new Date(input)
      if (isNaN(date.getTime())) {
        return {
          output: `无法解析日期: ${input}\n支持的格式: YYYY-MM-DD, YYYY-MM-DD HH:mm:ss`
        }
      }

      const timestamp = Math.floor(date.getTime() / 1000)

      return {
        output: `日期 ${input}:\n\n  🕐 Unix时间戳: ${timestamp}\n  📅 ISO格式: ${date.toISOString()}\n  🌏 本地时间: ${date.toLocaleString('zh-CN')}`
      }
    }
  },
  description: '时间戳转换工具',
  usage: 'timestamp [时间戳|日期]',
  examples: ['timestamp', 'timestamp 1609459200', 'timestamp 2021-01-01']
})

// 注册命令：快速JSON格式化
registerCommand('json-format', {
  handler: (context: CommandContext): CommandResult => {
    if (context.args.length === 0) {
      return {
        output: '用法: json-format <JSON字符串>'
      }
    }

    try {
      const input = context.args.join(' ')
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)

      return {
        output: `格式化JSON:\n\n${formatted}`
      }
    } catch (error) {
      return {
        output: `JSON解析失败: ${error instanceof Error ? error.message : '无效的JSON'}`
      }
    }
  },
  description: '格式化JSON',
  usage: 'json-format <JSON字符串>',
  examples: ['json-format \'{"name":"test"}\'']
})

console.log('[WebLinuxOS] 实时数据命令模块已加载')