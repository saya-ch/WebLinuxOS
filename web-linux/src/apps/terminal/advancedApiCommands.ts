import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithTimeout, handleApiError } from '../../config/apiConfig'

registerCommand('npm', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const packageName = args[0]

    if (!packageName) {
      return {
        output: [
          '📦 NPM 包搜索',
          '',
          '用法: npm <包名>',
          '',
          '示例: npm react',
          '      npm vue',
          '      npm express',
          '      npm @types/node',
        ].join('\n'),
      }
    }

    try {
      const response = await fetchWithTimeout(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(packageName)}&size=5`
      )

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const objects = data.objects || []

      if (objects.length === 0) {
        return { output: `📦 未找到与 "${packageName}" 相关的包` }
      }

      const output = [
        `📦 NPM 搜索: "${packageName}"`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
      ]

      objects.forEach((obj: { package: { name: string; description?: string; publisher?: { username?: string }; date?: string; version?: string }; score?: { final?: number } }, index: number) => {
        const pkg = obj.package
        const score = obj.score?.final || 0
        output.push(`${(index + 1).toString().padStart(2)}. ${pkg.name}`)
        output.push(`    ${pkg.description || '无描述'}`)
        output.push(`    版本: ${pkg.version || '?'} | 作者: ${pkg.publisher?.username || '未知'} | 相关度: ${(score * 100).toFixed(0)}%`)
        if (pkg.date) {
          output.push(`    更新: ${new Date(pkg.date).toLocaleDateString('zh-CN')}`)
        }
        output.push(`    🔗 https://www.npmjs.com/package/${pkg.name}`)
        output.push('')
      })

      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('数据来源: NPM Registry API')

      return { output: output.join('\n') }
    } catch (error) {
      const output = [
        `📦 NPM 搜索: "${packageName}"`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
      ]

      const fallbackPackages = getFallbackNpmPackages(packageName)
      fallbackPackages.forEach((pkg, i) => {
        output.push(`${(i + 1).toString().padStart(2)}. ${pkg.name}`)
        output.push(`    ${pkg.description}`)
        output.push(`    版本: ${pkg.version} | 周下载: ${pkg.downloads}`)
        output.push(`    🔗 https://www.npmjs.com/package/${pkg.name}`)
        output.push('')
      })

      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      output.push(handleApiError(error, 'NPM Registry API'))
      output.push('提示: 使用备用数据')

      return { output: output.join('\n') }
    }
  },
  description: '搜索NPM包信息',
  usage: 'npm <包名>',
  examples: ['npm react', 'npm vue', 'npm express']
})

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const amount = args[0] || '1'
    const from = (args[1] || 'USD').toUpperCase()
    const to = (args[2] || 'CNY').toUpperCase()

    try {
      const response = await fetchWithTimeout(
        `https://open.er-api.com/v6/latest/${from}`
      )

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      if (!data.rates || !data.rates[to]) {
        throw new Error(`不支持的货币: ${to}`)
      }

      const rate = data.rates[to]
      const result = (parseFloat(amount) * rate).toFixed(4)
      const time = data.time_last_update_utc ? new Date(data.time_last_update_utc).toLocaleString('zh-CN') : ''

      const output = [
        '💱 货币汇率',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${amount} ${from} = ${result} ${to}`,
        '',
        `汇率: 1 ${from} = ${rate.toFixed(6)} ${to}`,
        '',
        `更新时间: ${time}`,
        '',
        '支持的货币:',
        '  USD, EUR, CNY, JPY, GBP, HKD, AUD, CAD,',
        '  SGD, CHF, KRW, MXN, INR, RUB, ZAR, SEK,',
        '  NOK, DKK, NZD, TRY, AED, SAR, THB, IDR...',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '数据来源: ExchangeRate API',
        '提示: 使用 rates <货币> 查看所有汇率',
      ]

      return { output: output.join('\n') }
    } catch (error) {
      const fallback = getFallbackRate(from, to)
      const result = (parseFloat(amount) * fallback).toFixed(4)

      const output = [
        '💱 货币汇率 (备用数据)',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${amount} ${from} = ${result} ${to}`,
        `汇率: 1 ${from} = ${fallback.toFixed(6)} ${to}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        handleApiError(error, 'ExchangeRate API'),
      ]

      return { output: output.join('\n') }
    }
  },
  description: '货币汇率转换',
  usage: 'currency [金额] [源货币] [目标货币]',
  examples: ['currency 100 USD CNY', 'currency 50 EUR JPY', 'currency 1 BTC USD']
})

registerCommand('weather-cli', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'

    try {
      const response = await fetchWithTimeout(
        `https://wttr.in/${encodeURIComponent(city)}?format=j1`
      )

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const current = data.current_condition?.[0]
      const nearestArea = data.nearest_area?.[0]
      const weatherArea = data.weather?.[0]

      if (!current) throw new Error('无天气数据')

      const areaName = [
        nearestArea?.areaName?.[0]?.value,
        nearestArea?.region?.[0]?.value,
        nearestArea?.country?.[0]?.value,
      ].filter(Boolean).join(', ')

      const output = [
        '☁️ 天气预报',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `📍 ${areaName || city}`,
        '',
        `温度: ${current.temp_C}°C (体感 ${current.FeelsLikeC}°C)`,
        `天气: ${current.weatherDesc?.[0]?.value || '未知'}`,
        `湿度: ${current.humidity}%`,
        `风速: ${current.windspeedKmph} km/h ${current.winddir16Point}`,
        `气压: ${current.pressure} hPa`,
        `能见度: ${current.visibility} km`,
        `紫外线: ${current.uvIndex}`,
        '',
      ]

      if (weatherArea) {
        output.push('未来天气预报:')
        weatherArea.forEach((day: { date: string; maxtempC: string; mintempC: string; hourly?: Array<{ weatherDesc?: Array<{ value?: string }> }> }) => {
          const desc = day.hourly?.[4]?.weatherDesc?.[0]?.value || day.hourly?.[0]?.weatherDesc?.[0]?.value || ''
          output.push(`  ${day.date}: ${day.mintempC}°C ~ ${day.maxtempC}°C ${desc}`)
        })
      }

      output.push('')
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('数据来源: wttr.in')

      return { output: output.join('\n') }
    } catch (error) {
      const fallbackWeather = getFallbackWeather(city)

      const output = [
        '☁️ 天气预报 (备用数据)',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `📍 ${city}`,
        '',
        `温度: ${fallbackWeather.temp}°C`,
        `天气: ${fallbackWeather.desc}`,
        `湿度: ${fallbackWeather.humidity}%`,
        `风速: ${fallbackWeather.wind} km/h`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        handleApiError(error, 'wttr.in'),
        '提示: 使用备用数据',
      ]

      return { output: output.join('\n') }
    }
  },
  description: '查询城市天气',
  usage: 'weather-cli <城市>',
  examples: ['weather-cli Beijing', 'weather-cli Shanghai', 'weather-cli New York']
})

registerCommand('ip', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout('https://ipapi.co/json/')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      const output = [
        '🌐 IP 地址信息',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `IP地址: ${data.ip || '未知'}`,
        `版本: IPv${data.version || '4'}`,
        '',
        `城市: ${data.city || '未知'}`,
        `地区: ${data.region || '未知'}`,
        `国家: ${data.country_name || '未知'} (${data.country_code || '--'})`,
        `时区: ${data.timezone || '未知'}`,
        `邮编: ${data.postal || '未知'}`,
        '',
        `ISP: ${data.org || '未知'}`,
        `ASN: ${data.asn || '未知'}`,
        `货币: ${data.currency || '未知'}`,
        '',
        `坐标: ${data.latitude?.toFixed(4) || '?'}, ${data.longitude?.toFixed(4) || '?'}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '数据来源: ipapi.co',
      ]

      return { output: output.join('\n') }
    } catch (error) {
      const output = [
        '🌐 IP 地址信息',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        handleApiError(error, 'ipapi.co'),
        '',
        '提示: 网络请求可能被浏览器CORS策略阻止',
        '      在设置中允许不受信任的源或使用本地回退数据',
      ]

      return { output: output.join('\n') }
    }
  },
  description: '查询当前IP地址信息',
  usage: 'ip',
  examples: ['ip']
})

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return {
        output: [
          '🌍 翻译工具',
          '',
          '用法: translate <文本>',
          '',
          '示例: translate Hello World',
          '      translate 你好世界',
          '',
          '支持自动检测源语言，默认翻译为中文或英文',
        ].join('\n'),
      }
    }

    try {
      const encodedText = encodeURIComponent(text)
      const response = await fetchWithTimeout(
        `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=auto|zh-CN`
      )

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const translated = data.responseData?.translatedText || data.matches?.[0]?.translation || ''

      const output = [
        '🌍 翻译结果',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `原文: ${text}`,
        '',
        `译文: ${translated || '无结果'}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '数据来源: MyMemory Translation API',
      ]

      return { output: output.join('\n') }
    } catch (error) {
      const output = [
        '🌍 翻译结果',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `原文: ${text}`,
        '',
        handleApiError(error, 'MyMemory API'),
        '',
        '提示: 网络请求可能被浏览器CORS策略阻止',
      ]

      return { output: output.join('\n') }
    }
  },
  description: '在线翻译（自动检测语言）',
  usage: 'translate <文本>',
  examples: ['translate Hello World', 'translate 你好']
})

registerCommand('ascii', {
  handler: async (): Promise<CommandResult> => {
    const art = `
    ╔═══════════════════════════════════════════════════════════╗
    ║                    WebLinuxOS 终端                        ║
    ║                   基于Web的Linux桌面                      ║
    ║                                                         ║
    ║   输入 help 查看所有可用命令                              ║
    ║   输入 about 了解项目信息                                ║
    ║   输入 news 查看科技新闻                                 ║
    ║   输入 crypto 查看加密货币行情                           ║
    ║                                                         ║
    ║   GitHub: github.com/saya-ch/WebLinuxOS                  ║
    ║   部署:   saya-ch.github.io/WebLinuxOS/                  ║
    ╚═══════════════════════════════════════════════════════════╝
`
    return { output: art }
  },
  description: '显示ASCII艺术横幅',
  usage: 'ascii',
  examples: ['ascii']
})

function getFallbackNpmPackages(query: string) {
  const pkgs = [
    { name: 'react', description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.', version: '18.3.1', downloads: '45M+' },
    { name: 'vue', description: 'The Progressive JavaScript Framework.', version: '3.4.0', downloads: '38M+' },
    { name: 'express', description: 'Fast, minimalist web framework.', version: '4.19.2', downloads: '28M+' },
    { name: 'typescript', description: 'TypeScript is a language for application scale JavaScript development.', version: '5.4.0', downloads: '52M+' },
    { name: 'next', description: 'The React Framework for the Web.', version: '14.2.0', downloads: '18M+' },
    { name: 'tailwindcss', description: 'A utility-first CSS framework for rapid UI development.', version: '3.4.0', downloads: '15M+' },
    { name: 'vite', description: 'Next generation frontend tooling.', version: '5.2.0', downloads: '22M+' },
    { name: 'lodash', description: 'Lodash modular utilities.', version: '4.17.21', downloads: '68M+' },
    { name: 'axios', description: 'Promise based HTTP client for the browser and node.js.', version: '1.6.7', downloads: '35M+' },
    { name: 'socket.io', description: 'Real-time application framework.', version: '4.7.4', downloads: '12M+' },
  ]
  const q = query.toLowerCase()
  return pkgs.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)).slice(0, 5)
}

function getFallbackRate(from: string, to: string): number {
  const rates: Record<string, number> = {
    USD: 1, EUR: 0.92, CNY: 7.24, JPY: 149.5, GBP: 0.79, HKD: 7.82,
    AUD: 1.53, CAD: 1.36, SGD: 1.34, CHF: 0.89, KRW: 1320, INR: 83.5,
    RUB: 92.5, ZAR: 18.5, SEK: 10.6, NOK: 10.8, DKK: 6.8, NZD: 1.64,
    TRY: 32.5, AED: 3.67, SAR: 3.75, THB: 35.5, IDR: 15700,
  }
  const fromRate = rates[from] || 1
  const toRate = rates[to] || 1
  return toRate / fromRate
}

function getFallbackWeather(city: string) {
  const weathers: Record<string, { temp: number; desc: string; humidity: number; wind: number }> = {
    beijing: { temp: 22, desc: '多云', humidity: 45, wind: 12 },
    shanghai: { temp: 26, desc: '小雨', humidity: 78, wind: 18 },
    'new york': { temp: 18, desc: '晴', humidity: 55, wind: 8 },
    london: { temp: 12, desc: '阴', humidity: 82, wind: 15 },
    tokyo: { temp: 20, desc: '晴', humidity: 60, wind: 10 },
  }
  const key = city.toLowerCase()
  if (weathers[key]) return weathers[key]
  return { temp: 15 + Math.round(Math.random() * 20), desc: '多云', humidity: 50 + Math.round(Math.random() * 30), wind: 5 + Math.round(Math.random() * 15) }
}
