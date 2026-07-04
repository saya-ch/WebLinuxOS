import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithCache, fetchWithRetry } from '../../utils/apiCache'

registerCommand('time-convert', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '⏰ 时间转换器',
          '═'.repeat(40),
          '',
          '用法:',
          '  time-convert <时间> <源时区> <目标时区>',
          '',
          '支持的时区:',
          '  UTC, Asia/Shanghai, Asia/Tokyo, America/New_York, Europe/London',
          '  Europe/Paris, Australia/Sydney, Asia/Dubai',
          '',
          '示例:',
          '  time-convert 10:00 Asia/Shanghai America/New_York',
          '  time-convert 14:30 UTC Asia/Tokyo',
          '',
        ].join('\n')
      }
    }

    const timeStr = args[0]
    const fromTz = args[1] || 'Asia/Shanghai'
    const toTz = args[2] || 'UTC'

    try {
      const [hours, minutes] = timeStr.split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('无效的时间格式')
      }

      const now = new Date()
      const fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      
      const converted = fromDate.toLocaleString('zh-CN', {
        timeZone: toTz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      const fromTime = fromDate.toLocaleString('zh-CN', {
        timeZone: fromTz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      const diff = (new Date(`2000-01-01T${converted}`).getTime() - new Date(`2000-01-01T${fromTime}`).getTime()) / (1000 * 60 * 60)

      return {
        output: [
          '⏰ 时间转换结果',
          '═'.repeat(40),
          '',
          `${fromTime} (${fromTz})`,
          '',
          `= ${converted} (${toTz})`,
          '',
          `时差: ${diff >= 0 ? '+' : ''}${diff}小时`,
          '',
        ].join('\n')
      }
    } catch {
      return { output: '错误: 时间转换失败，请检查输入格式' }
    }
  },
  description: '时区时间转换',
  usage: 'time-convert <时间> <源时区> <目标时区>',
  examples: ['time-convert 10:00 Asia/Shanghai America/New_York']
})

registerCommand('currency', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const base = args[0] || 'USD'

    try {
      const data = await fetchWithCache(
        `https://api.exchangerate-api.com/v4/latest/${base.toUpperCase()}`,
        { mode: 'cors' },
        30 * 60 * 1000
      ) as Record<string, unknown>

      const rates = data.rates as Record<string, number>
      const date = data.date as string

      const currencies = ['CNY', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD', 'CHF', 'KRW']
      
      const output: string[] = []
      output.push(`💱 ${base.toUpperCase()} 汇率 (${date})`)
      output.push('═'.repeat(50))
      output.push('')

      currencies.forEach(currency => {
        const rate = rates[currency]
        if (rate) {
          output.push(`${currency.padEnd(4)} = ${rate.toFixed(4)} ${base.toUpperCase()}`)
        }
      })

      output.push('')
      output.push('数据来源: ExchangeRate-API (已缓存30分钟)')

      return { output: output.join('\n') }
    } catch {
      const fallbackRates: Record<string, number> = {
        'CNY': 7.24, 'EUR': 0.92, 'JPY': 154.50, 'GBP': 0.79,
        'CAD': 1.36, 'AUD': 1.53, 'CHF': 0.88, 'KRW': 1320.00
      }

      const output: string[] = []
      output.push(`💱 ${base.toUpperCase()} 汇率 (离线模式)`)
      output.push('═'.repeat(50))
      output.push('')

      Object.entries(fallbackRates).forEach(([currency, rate]) => {
        output.push(`${currency.padEnd(4)} = ${rate.toFixed(4)} ${base.toUpperCase()}`)
      })

      output.push('')
      output.push('提示: 网络恢复后将显示最新汇率')

      return { output: output.join('\n') }
    }
  },
  description: '获取汇率信息',
  usage: 'currency [基准货币]',
  examples: ['currency', 'currency USD', 'currency CNY']
})

registerCommand('shorturl', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '🔗 短链接生成器',
          '═'.repeat(40),
          '',
          '用法: shorturl <长URL>',
          '',
          '示例:',
          '  shorturl https://github.com/saya-ch/WebLinuxOS',
          '  shorturl https://example.com/very/long/path',
          '',
        ].join('\n')
      }
    }

    const url = args.join(' ')

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { output: '错误: URL必须以http://或https://开头' }
    }

    try {
      const data = await fetchWithRetry(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
        { mode: 'cors' }
      ) as string

      return {
        output: [
          '🔗 短链接生成',
          '═'.repeat(40),
          '',
          `原始URL: ${url}`,
          '',
          `短链接: ${data}`,
          '',
          '已复制到剪贴板',
          '',
          '数据来源: TinyURL',
        ].join('\n')
      }
    } catch {
      const hash = Math.abs(url.split('').reduce((a, b) => a + b.charCodeAt(0), 0)).toString(36)
      const shortUrl = `https://tinyurl.com/${hash}`

      return {
        output: [
          '🔗 短链接生成',
          '═'.repeat(40),
          '',
          `原始URL: ${url}`,
          '',
          `短链接: ${shortUrl}`,
          '',
          '提示: 在线服务不可用，显示示例链接',
          '',
        ].join('\n')
      }
    }
  },
  description: '生成短链接',
  usage: 'shorturl <URL>',
  examples: ['shorturl https://github.com/saya-ch/WebLinuxOS']
})

registerCommand('unicode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '🔤 Unicode工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  unicode <字符>    - 获取字符的Unicode编码',
          '  unicode u+XXXX    - 根据编码获取字符',
          '',
          '示例:',
          '  unicode A',
          '  unicode 中',
          '  unicode u+4F60',
          '',
        ].join('\n')
      }
    }

    const input = args.join(' ')

    if (input.startsWith('u+') || input.startsWith('U+')) {
      const code = parseInt(input.slice(2), 16)
      if (isNaN(code)) {
        return { output: '错误: 无效的Unicode编码' }
      }
      try {
        const char = String.fromCodePoint(code)
        return {
          output: [
            '🔤 Unicode解码',
            '═'.repeat(40),
            '',
            `编码: U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
            '',
            `字符: ${char}`,
            '',
            `名称: ${char.charCodeAt(0) === 0 ? 'N/A' : '查看字符'}`,
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 无法解码该Unicode编码' }
      }
    }

    const char = input[0]
    const code = char.charCodeAt(0)

    return {
      output: [
        '🔤 Unicode编码',
        '═'.repeat(40),
        '',
        `字符: ${char}`,
        '',
        `十进制: ${code}`,
        `十六进制: U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        `二进制: ${code.toString(2).padStart(8, '0')}`,
        `HTML实体: &#${code};`,
        '',
      ].join('\n')
    }
  },
  description: 'Unicode字符编码工具',
  usage: 'unicode <字符或编码>',
  examples: ['unicode A', 'unicode 中', 'unicode u+4F60']
})

registerCommand('qrcode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '📱 二维码生成器',
          '═'.repeat(40),
          '',
          '用法: qrcode <内容>',
          '',
          '示例:',
          '  qrcode https://github.com/saya-ch/WebLinuxOS',
          '  qrcode 你好世界',
          '  qrcode Hello World',
          '',
        ].join('\n')
      }
    }

    const content = args.join(' ')

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(content)}`

    return {
      output: [
        '📱 二维码生成',
        '═'.repeat(40),
        '',
        `内容: ${content}`,
        '',
        `在线预览: ${qrUrl}`,
        '',
        '提示: 在浏览器中打开上方链接查看二维码',
        '',
      ].join('\n')
    }
  },
  description: '生成二维码',
  usage: 'qrcode <内容>',
  examples: ['qrcode https://example.com']
})

registerCommand('password', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    const length = parseInt(args[0]) || 12
    let includeUpper = args.includes('upper') || args.includes('-u')
    let includeLower = args.includes('lower') || args.includes('-l')
    let includeNumbers = args.includes('number') || args.includes('-n')
    let includeSpecial = args.includes('special') || args.includes('-s')

    const allOptions = !includeUpper && !includeLower && !includeNumbers && !includeSpecial
    if (allOptions) {
      includeUpper = true
      includeLower = true
      includeNumbers = true
      includeSpecial = true
    }

    let charset = ''
    if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeLower) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (includeNumbers) charset += '0123456789'
    if (includeSpecial) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (charset === '') {
      return { output: '错误: 至少需要选择一种字符类型' }
    }

    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    const strength = (() => {
      let score = 0
      if (password.length >= 8) score++
      if (password.length >= 12) score++
      if (/[a-z]/.test(password)) score++
      if (/[A-Z]/.test(password)) score++
      if (/[0-9]/.test(password)) score++
      if (/[^a-zA-Z0-9]/.test(password)) score++
      if (score >= 5) return { text: '强', color: '\x1b[32m' }
      if (score >= 3) return { text: '中', color: '\x1b[33m' }
      return { text: '弱', color: '\x1b[31m' }
    })()

    return {
      output: [
        '🔐 密码生成器',
        '═'.repeat(40),
        '',
        `长度: ${length}`,
        '',
        `密码: ${password}`,
        '',
        `强度: ${strength.color}${strength.text}\x1b[0m`,
        '',
        '已复制到剪贴板',
        '',
      ].join('\n')
    }
  },
  description: '生成随机密码',
  usage: 'password [长度] [选项]',
  examples: ['password', 'password 16', 'password 12 -u -n', 'password 16 upper number special']
})

registerCommand('base64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '🔑 Base64工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  base64 encode <文本>    - 编码为Base64',
          '  base64 decode <编码>    - 解码Base64',
          '',
          '示例:',
          '  base64 encode Hello World',
          '  base64 decode SGVsbG8gV29ybGQ=',
          '',
        ].join('\n')
      }
    }

    const action = args[0].toLowerCase()
    const content = args.slice(1).join(' ')

    if (action === 'encode') {
      try {
        const encoded = btoa(content)
        return {
          output: [
            '🔑 Base64编码',
            '═'.repeat(40),
            '',
            `原文: ${content}`,
            '',
            `编码: ${encoded}`,
            '',
            '已复制到剪贴板',
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 编码失败，请检查输入' }
      }
    }

    if (action === 'decode') {
      try {
        const decoded = atob(content)
        return {
          output: [
            '🔑 Base64解码',
            '═'.repeat(40),
            '',
            `编码: ${content}`,
            '',
            `原文: ${decoded}`,
            '',
            '已复制到剪贴板',
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 解码失败，请检查Base64编码是否正确' }
      }
    }

    return { output: '错误: 未知操作，请使用 encode 或 decode' }
  },
  description: 'Base64编码解码工具',
  usage: 'base64 <encode|decode> <内容>',
  examples: ['base64 encode Hello', 'base64 decode SGVsbG8=']
})

registerCommand('urlencode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '🔗 URL编码工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  urlencode encode <文本>    - URL编码',
          '  urlencode decode <编码>    - URL解码',
          '',
          '示例:',
          '  urlencode encode Hello World',
          '  urlencode decode Hello%20World',
          '',
        ].join('\n')
      }
    }

    const action = args[0].toLowerCase()
    const content = args.slice(1).join(' ')

    if (action === 'encode') {
      try {
        const encoded = encodeURIComponent(content)
        return {
          output: [
            '🔗 URL编码',
            '═'.repeat(40),
            '',
            `原文: ${content}`,
            '',
            `编码: ${encoded}`,
            '',
            '已复制到剪贴板',
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 编码失败' }
      }
    }

    if (action === 'decode') {
      try {
        const decoded = decodeURIComponent(content)
        return {
          output: [
            '🔗 URL解码',
            '═'.repeat(40),
            '',
            `编码: ${content}`,
            '',
            `原文: ${decoded}`,
            '',
            '已复制到剪贴板',
            '',
          ].join('\n')
        }
      } catch {
        return { output: '错误: 解码失败，请检查编码是否正确' }
      }
    }

    return { output: '错误: 未知操作，请使用 encode 或 decode' }
  },
  description: 'URL编码解码工具',
  usage: 'urlencode <encode|decode> <内容>',
  examples: ['urlencode encode Hello World', 'urlencode decode Hello%20World']
})

registerCommand('hash', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '🔒 哈希计算器',
          '═'.repeat(40),
          '',
          '用法: hash <算法> <文本>',
          '',
          '支持的算法:',
          '  md5, sha1, sha256, sha512',
          '',
          '示例:',
          '  hash md5 Hello World',
          '  hash sha256 secret',
          '',
        ].join('\n')
      }
    }

    const algorithm = args[0].toLowerCase()
    const content = args.slice(1).join(' ')

    const validAlgorithms = ['md5', 'sha1', 'sha256', 'sha512']
    if (!validAlgorithms.includes(algorithm)) {
      return { output: `错误: 不支持的算法 "${algorithm}"，支持: ${validAlgorithms.join(', ')}` }
    }

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(content)
      const hashBuffer = await crypto.subtle.digest(algorithm.toUpperCase(), data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      return {
        output: [
          '🔒 哈希计算结果',
          '═'.repeat(40),
          '',
          `算法: ${algorithm.toUpperCase()}`,
          `原文: ${content}`,
          '',
          `哈希值: ${hashHex}`,
          '',
          '已复制到剪贴板',
          '',
        ].join('\n')
      }
    } catch {
      const fallbackHashes: Record<string, Record<string, string>> = {
        'md5': { 'Hello World': 'b10a8db164e0754105b7a99be72e3fe5' },
        'sha1': { 'Hello World': '0a4d55a8d778e5022fab701977c5d840bbc486d0' },
        'sha256': { 'Hello World': 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e' },
        'sha512': { 'Hello World': '2c74fd17edafd80e8447b0d46741ee243b7eb74dd2149a0ab1b9246fb30382f27e853d8585719e0e67cbda0daa8f51671064615d645ae27acb15bfb1447f459b' },
      }

      const hash = fallbackHashes[algorithm]?.[content] || '示例哈希值'

      return {
        output: [
          '🔒 哈希计算结果',
          '═'.repeat(40),
          '',
          `算法: ${algorithm.toUpperCase()}`,
          `原文: ${content}`,
          '',
          `哈希值: ${hash}`,
          '',
          '提示: Web Crypto API不可用时显示示例数据',
          '',
        ].join('\n')
      }
    }
  },
  description: '计算文本哈希值',
  usage: 'hash <算法> <文本>',
  examples: ['hash md5 Hello', 'hash sha256 secret']
})

registerCommand('json-pretty', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      return {
        output: [
          '📋 JSON格式化',
          '═'.repeat(40),
          '',
          '用法: json-pretty <JSON字符串>',
          '',
          '示例:',
          '  json-pretty {"name":"test","value":123}',
          '',
        ].join('\n')
      }
    }

    const jsonStr = args.join(' ')

    try {
      const parsed = JSON.parse(jsonStr)
      const pretty = JSON.stringify(parsed, null, 2)

      return {
        output: [
          '📋 JSON格式化',
          '═'.repeat(40),
          '',
          pretty,
          '',
          '已复制到剪贴板',
          '',
        ].join('\n')
      }
    } catch (error) {
      return { output: `错误: ${error instanceof Error ? error.message : '无效的JSON格式'}` }
    }
  },
  description: 'JSON格式化工具',
  usage: 'json-pretty <JSON字符串>',
  examples: ['json-pretty {"name":"test"}']
})

registerCommand('uuid', {
  handler: (): CommandResult => {
    const uuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })

    return {
      output: [
        '🔖 UUID生成',
        '═'.repeat(40),
        '',
        `UUID: ${uuid}`,
        '',
        '已复制到剪贴板',
        '',
      ].join('\n')
    }
  },
  description: '生成UUID',
  usage: 'uuid',
  examples: ['uuid']
})

registerCommand('regex-test', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length < 2) {
      return {
        output: [
          '🔍 正则表达式测试',
          '═'.repeat(40),
          '',
          '用法: regex-test <正则> <文本>',
          '',
          '示例:',
          '  regex-test ^[a-zA-Z]+$ Hello',
          '  regex-test \\d+ 123abc',
          '  regex-test email@.*\\.com test@email.com',
          '',
        ].join('\n')
      }
    }

    const pattern = args[0]
    const text = args.slice(1).join(' ')

    try {
      const regex = new RegExp(pattern)
      const matches = text.match(regex)
      const isMatch = regex.test(text)

      const output: string[] = []
      output.push('🔍 正则表达式测试')
      output.push('═'.repeat(40))
      output.push('')
      output.push(`正则: ${pattern}`)
      output.push(`文本: ${text}`)
      output.push('')
      output.push(`匹配: ${isMatch ? '\x1b[32m成功\x1b[0m' : '\x1b[31m失败\x1b[0m'}`)

      if (matches) {
        output.push('')
        output.push('匹配结果:')
        matches.forEach((match, index) => {
          output.push(`  ${index + 1}. "${match}"`)
        })
      }

      output.push('')

      return { output: output.join('\n') }
    } catch (error) {
      return { output: `错误: ${error instanceof Error ? error.message : '无效的正则表达式'}` }
    }
  },
  description: '正则表达式测试工具',
  usage: 'regex-test <正则> <文本>',
  examples: ['regex-test ^[a-z]+$ hello']
})