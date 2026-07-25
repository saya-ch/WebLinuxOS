import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
      ...options,
    })
    if (!response.ok) throw new Error('HTTP error')
    return await response.json()
  } catch {
    return null
  }
}

function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

registerCommand('quote', {
  handler: async (): Promise<CommandResult> => {
    const data = await fetchJson<Array<{ q: string; a: string }>>('https://zenquotes.io/api/random')

    if (data && data[0]) {
      return {
        output: [
          '',
          `  "${data[0].q}"`,
          '',
          `     —— ${data[0].a}`,
          '',
        ].join('\n'),
      }
    }

    const fallbackQuotes = [
      { q: '生活中最重要的事情不是所处的位置，而是你前进的方向。', a: '奥利弗·温德尔·霍姆斯' },
      { q: '成功不是终点，失败也不是末日，重要的是继续前进的勇气。', a: '温斯顿·丘吉尔' },
      { q: '唯一真正的失败是不去尝试。', a: '乔治·伯纳德·肖' },
      { q: '伟大的工作不是靠力量完成的，而是靠坚持。', a: '塞缪尔·约翰逊' },
      { q: '千里之行，始于足下。', a: '老子' },
      { q: '学而不思则罔，思而不学则殆。', a: '孔子' },
      { q: '天行健，君子以自强不息。', a: '《周易》' },
      { q: '不积跬步，无以至千里；不积小流，无以成江海。', a: '荀子' },
    ]
    const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]

    return {
      output: [
        '',
        `  "${random.q}"`,
        '',
        `     —— ${random.a}`,
        '',
      ].join('\n'),
    }
  },
  description: '获取一句励志名言',
  usage: 'quote',
  examples: ['quote'],
})

registerCommand('uuidgen', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = Math.min(Math.max(parseInt(args[0]) || 1, 1), 50)

    function generateUUID(): string {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    const uuids = Array.from({ length: count }, () => generateUUID())
    return { output: uuids.join('\n') }
  },
  description: '生成 UUID（支持批量）',
  usage: 'uuidgen [数量]',
  examples: ['uuidgen', 'uuidgen 5'],
})

registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const now = new Date()
    const ts = Math.floor(now.getTime() / 1000)
    const ms = now.getTime()

    if (args[0]) {
      const input = parseInt(args[0])
      if (isNaN(input)) {
        return { output: '错误: 无效的时间戳' }
      }
      const date = new Date(input > 9999999999 ? input : input * 1000)
      return {
        output: [
          '',
          `  时间戳:   ${input}`,
          `  日期时间: ${formatDate(date)}`,
          `  ISO:      ${date.toISOString()}`,
          '',
        ].join('\n'),
      }
    }

    return {
      output: [
        '',
        `  Unix 时间戳:  ${ts}`,
        `  毫秒时间戳:   ${ms}`,
        `  日期时间:     ${formatDate(now)}`,
        `  ISO 格式:     ${now.toISOString()}`,
        `  UTC:          ${now.toUTCString()}`,
        '',
      ].join('\n'),
    }
  },
  description: '时间戳转换（当前时间或时间戳转日期）',
  usage: 'timestamp [时间戳]',
  examples: ['timestamp', 'timestamp 1700000000'],
})

registerCommand('base64-encode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    if (!text) {
      return { output: '用法: base64-encode <文本>' }
    }
    try {
      const encoded = btoa(unescape(encodeURIComponent(text)))
      return { output: encoded }
    } catch {
      return { output: '编码失败' }
    }
  },
  description: 'Base64 编码',
  usage: 'base64-encode <文本>',
  examples: ['base64-encode hello world'],
})

registerCommand('base64-decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    if (!text) {
      return { output: '用法: base64-decode <base64字符串>' }
    }
    try {
      const decoded = decodeURIComponent(escape(atob(text)))
      return { output: decoded }
    } catch {
      return { output: '解码失败：无效的 Base64 字符串' }
    }
  },
  description: 'Base64 解码',
  usage: 'base64-decode <base64字符串>',
  examples: ['base64-decode aGVsbG8gd29ybGQ='],
})

registerCommand('url-encode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    if (!text) {
      return { output: '用法: url-encode <文本>' }
    }
    return { output: encodeURIComponent(text) }
  },
  description: 'URL 编码',
  usage: 'url-encode <文本>',
  examples: ['url-encode hello world'],
})

registerCommand('url-decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    if (!text) {
      return { output: '用法: url-decode <编码后的文本>' }
    }
    try {
      return { output: decodeURIComponent(text) }
    } catch {
      return { output: '解码失败：无效的 URL 编码字符串' }
    }
  },
  description: 'URL 解码',
  usage: 'url-decode <编码后的文本>',
  examples: ['url-decode hello%20world'],
})

registerCommand('random', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const min = parseInt(args[0]) || 1
    const max = parseInt(args[1]) || 100
    const count = Math.min(Math.max(parseInt(args[2]) || 1, 1), 100)

    if (min >= max) {
      return { output: '错误: 最小值必须小于最大值' }
    }

    const nums = Array.from({ length: count }, () =>
      Math.floor(Math.random() * (max - min + 1)) + min
    )
    return { output: nums.join('\n') }
  },
  description: '生成随机数',
  usage: 'random [最小值] [最大值] [数量]',
  examples: ['random', 'random 1 10', 'random 1 100 5'],
})

registerCommand('password-gen', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const length = Math.min(Math.max(parseInt(args[0]) || 16, 4), 128)

    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    let password = ''
    const array = new Uint32Array(length)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length]
      }
    } else {
      for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)]
      }
    }

    return {
      output: [
        '',
        `  密码: ${password}`,
        `  长度: ${length} 位`,
        '',
      ].join('\n'),
    }
  },
  description: '生成强密码',
  usage: 'password-gen [长度]',
  examples: ['password-gen', 'password-gen 32'],
})


