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

registerCommand('joke', {
  handler: async (): Promise<CommandResult> => {
    const data = await fetchJson<{ setup: string; punchline: string }>(
      'https://official-joke-api.appspot.com/random_joke'
    )

    if (data && data.setup) {
      return {
        output: [
          '',
          `  ${data.setup}`,
          '',
          `  ${data.punchline}`,
          '',
        ].join('\n'),
      }
    }

    const fallbackJokes = [
      { setup: '为什么程序员总是分不清万圣节和圣诞节？', punchline: '因为 Oct 31 = Dec 25。' },
      { setup: '程序员最讨厌的季节是什么？', punchline: '秋天，因为要处理太多 Fall。' },
      { setup: '为什么程序员喜欢黑色？', punchline: '因为浅色会有 bug。' },
      { setup: '一个 SQL 语句走进酒吧，看到两张表，问：', punchline: '"我可以加入你们吗？"' },
      { setup: '为什么程序员总是很穷？', punchline: '因为他们把所有的 cache 都清空了。' },
      { setup: '程序员的孩子为什么不哭？', punchline: '因为有 try-catch。' },
      { setup: '为什么 Java 开发者要戴眼镜？', punchline: '因为他们不会 C#。' },
    ]
    const random = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)]

    return {
      output: [
        '',
        `  ${random.setup}`,
        '',
        `  ${random.punchline}`,
        '',
      ].join('\n'),
    }
  },
  description: '讲一个程序员笑话',
  usage: 'joke',
  examples: ['joke'],
})

registerCommand('ipinfo', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const ip = args[0] || ''
    const url = ip
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : 'https://ipapi.co/json/'

    const data = await fetchJson<{
      ip: string
      city?: string
      region?: string
      country_name?: string
      postal?: string
      latitude?: number
      longitude?: number
      timezone?: string
      utc_offset?: string
      country_calling_code?: string
      currency?: string
      org?: string
      asn?: string
    }>(url)

    if (!data || !data.ip) {
      return {
        output: [
          '无法获取 IP 信息',
          '',
          '用法: ipinfo [IP地址]',
          '示例: ipinfo 8.8.8.8',
        ].join('\n'),
      }
    }

    const lines = [
      '',
      `  IP 地址:     ${data.ip}`,
    ]

    if (data.city) lines.push(`  城市:         ${data.city}`)
    if (data.region) lines.push(`  地区:         ${data.region}`)
    if (data.country_name) lines.push(`  国家:         ${data.country_name}`)
    if (data.postal) lines.push(`  邮编:         ${data.postal}`)
    if (data.latitude && data.longitude) {
      lines.push(`  坐标:         ${data.latitude}, ${data.longitude}`)
    }
    if (data.timezone) lines.push(`  时区:         ${data.timezone}`)
    if (data.utc_offset) lines.push(`  UTC 偏移:     ${data.utc_offset}`)
    if (data.country_calling_code) lines.push(`  区号:         ${data.country_calling_code}`)
    if (data.currency) lines.push(`  货币:         ${data.currency}`)
    if (data.org) lines.push(`  组织:         ${data.org}`)
    if (data.asn) lines.push(`  ASN:          ${data.asn}`)
    lines.push('')

    return { output: lines.join('\n') }
  },
  description: '查询 IP 地址信息',
  usage: 'ipinfo [IP地址]',
  examples: ['ipinfo', 'ipinfo 8.8.8.8'],
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

registerCommand('color', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const hex = args[0]

    if (!hex) {
      const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      return {
        output: [
          '',
          `  随机颜色: ${randomHex}`,
          '',
        ].join('\n'),
      }
    }

    let normalized = hex.startsWith('#') ? hex.slice(1) : hex
    if (normalized.length === 3) {
      normalized = normalized.split('').map((c) => c + c).join('')
    }
    if (normalized.length !== 6 || !/^[0-9a-fA-F]+$/.test(normalized)) {
      return { output: '错误: 无效的 HEX 颜色值' }
    }

    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)

    return {
      output: [
        '',
        `  HEX:   #${normalized}`,
        `  RGB:   rgb(${r}, ${g}, ${b})`,
        `  HSL:   hsl(${Math.round(0)}, ${Math.round(0)}%, ${Math.round(((r + g + b) / 3) / 255 * 100)}%)`,
        '',
      ].join('\n'),
    }
  },
  description: '颜色格式转换（HEX/RGB）',
  usage: 'color [HEX颜色]',
  examples: ['color', 'color #ff6b6b'],
})

registerCommand('dict', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const word = args.join(' ')
    if (!word) {
      return { output: '用法: dict <单词>' }
    }

    const data = await fetchJson<Array<{
      word: string
      meanings: Array<{
        partOfSpeech: string
        definitions: Array<{ definition: string; example?: string }>
      }>
      phonetic?: string
    }>>(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)

    if (!data || !data[0]) {
      return {
        output: [
          `未找到 "${word}" 的释义`,
          '',
          '提示: 目前仅支持英文单词查询',
        ].join('\n'),
      }
    }

    const entry = data[0]
    const lines: string[] = ['', `  ${entry.word}`]
    if (entry.phonetic) lines.push(`  ${entry.phonetic}`)
    lines.push('')

    for (const meaning of entry.meanings.slice(0, 3)) {
      lines.push(`  【${meaning.partOfSpeech}】`)
      for (const def of meaning.definitions.slice(0, 3)) {
        lines.push(`    • ${def.definition}`)
        if (def.example) {
          lines.push(`      例: ${def.example}`)
        }
      }
      lines.push('')
    }

    return { output: lines.join('\n') }
  },
  description: '英英词典查询',
  usage: 'dict <单词>',
  examples: ['dict hello', 'dict algorithm'],
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    const data = await fetchJson<{
      articles: Array<{ title: string; source: { name: string }; url?: string; publishedAt?: string }>
    }>('https://saurav.tech/NewsAPI/top-headlines/category/technology/us.json')

    if (data && data.articles && data.articles.length > 0) {
      const lines: string[] = ['', '  📰 科技新闻头条', '']
      data.articles.slice(0, 8).forEach((article, i) => {
        lines.push(`  ${i + 1}. ${article.title}`)
        lines.push(`     来源: ${article.source.name}`)
        lines.push('')
      })
      return { output: lines.join('\n') }
    }

    return {
      output: [
        '',
        '  📰 科技新闻（示例）',
        '',
        '  1. AI 技术突破：大语言模型能力持续提升',
        '     来源: Tech Daily',
        '',
        '  2. WebAssembly 成为浏览器端高性能计算新标准',
        '     来源: Web Weekly',
        '',
        '  3. TypeScript 5.0 发布，带来全新类型系统特性',
        '     来源: Dev Journal',
        '',
        '  4. 开源社区蓬勃发展，GitHub 新项目创新高',
        '     来源: Open Source Times',
        '',
        '  5. 云原生技术持续演进，Serverless 架构成主流',
        '     来源: Cloud Today',
        '',
      ].join('\n'),
    }
  },
  description: '查看科技新闻头条',
  usage: 'news',
  examples: ['news'],
})
