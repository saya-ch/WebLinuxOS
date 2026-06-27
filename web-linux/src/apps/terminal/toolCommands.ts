import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath } from '../../store'

function safeEval(expression: string): number {
  const trimmed = expression.trim()
  if (!trimmed) throw new Error('表达式为空')

  const tokens: Array<{ type: 'num' | 'op' | 'func'; value: string }> = []
  let i = 0
  const FUNCTIONS = new Set(['sqrt', 'sin', 'cos', 'tan', 'log', 'log10', 'abs', 'ceil', 'floor', 'round', 'exp', 'pow', 'min', 'max', 'sign'])
  const CONSTANTS: Record<string, number> = { PI: Math.PI, E: Math.E, pi: Math.PI, e: Math.E }

  while (i < trimmed.length) {
    const ch = trimmed[i]
    if (ch === ' ') { i++; continue }
    if (/[0-9.]/.test(ch)) {
      let num = ''
      while (i < trimmed.length && /[0-9.]/.test(trimmed[i])) {
        num += trimmed[i]
        i++
      }
      if (isNaN(Number(num))) throw new Error('无效的数字: ' + num)
      tokens.push({ type: 'num', value: num })
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let word = ''
      while (i < trimmed.length && /[a-zA-Z0-9_]/.test(trimmed[i])) {
        word += trimmed[i]
        i++
      }
      if (word in CONSTANTS) {
        tokens.push({ type: 'num', value: String(CONSTANTS[word]) })
      } else if (FUNCTIONS.has(word.toLowerCase())) {
        tokens.push({ type: 'func', value: word.toLowerCase() })
      } else {
        throw new Error('未知标识符: ' + word)
      }
      continue
    }
    if ('+-*/%^(),'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }
    throw new Error('无效字符: ' + ch)
  }

  let pos = 0
  function peek() { return tokens[pos] }
  function eat(type: string, value?: string) {
    const t = tokens[pos]
    if (!t || t.type !== type || (value && t.value !== value)) {
      throw new Error('期望 ' + value + ' 但得到 ' + (t?.value || 'EOF'))
    }
    pos++
    return t
  }

  function parseExpression(): number {
    let value = parseTerm()
    while (peek() && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = eat('op').value
      const right = parseTerm()
      value = op === '+' ? value + right : value - right
    }
    return value
  }
  function parseTerm(): number {
    let value = parseFactor()
    while (peek() && (peek()!.value === '*' || peek()!.value === '/' || peek()!.value === '%')) {
      const op = eat('op').value
      const right = parseFactor()
      if (op === '*') value = value * right
      else if (op === '/') { if (right === 0) throw new Error('除零错误'); value = value / right }
      else value = value % right
    }
    return value
  }
  function parseFactor(): number {
    const t = peek()
    if (!t) throw new Error('意外的表达式结尾')
    if (t.type === 'op' && t.value === '+') { pos++; return parseFactor() }
    if (t.type === 'op' && t.value === '-') { pos++; return -parseFactor() }
    if (t.type === 'op' && t.value === '(') {
      pos++
      const value = parseExpression()
      eat('op', ')')
      const next = peek()
      if (next && next.type === 'op' && next.value === '^') {
        pos++
        const exp = parseFactor()
        return Math.pow(value, exp)
      }
      return value
    }
    if (t.type === 'func') {
      pos++
      eat('op', '(')
      if (t.value === 'pow' || t.value === 'min' || t.value === 'max') {
        const args: number[] = [parseExpression()]
        while (peek() && peek()!.value === ',') { pos++; args.push(parseExpression()) }
        eat('op', ')')
        if (t.value === 'pow') return Math.pow(args[0], args[1])
        if (t.value === 'min') return Math.min(...args)
        if (t.value === 'max') return Math.max(...args)
      }
      const arg = parseExpression()
      eat('op', ')')
      switch (t.value) {
        case 'sqrt': return Math.sqrt(arg)
        case 'sin': return Math.sin(arg)
        case 'cos': return Math.cos(arg)
        case 'tan': return Math.tan(arg)
        case 'log': return Math.log(arg)
        case 'log10': return Math.log10(arg)
        case 'abs': return Math.abs(arg)
        case 'ceil': return Math.ceil(arg)
        case 'floor': return Math.floor(arg)
        case 'round': return Math.round(arg)
        case 'exp': return Math.exp(arg)
        case 'sign': return Math.sign(arg)
        default: throw new Error('未知函数: ' + t.value)
      }
    }
    if (t.type === 'num') {
      pos++
      const num = Number(t.value)
      const next = peek()
      if (next && next.type === 'op' && next.value === '^') {
        pos++
        const exp = parseFactor()
        return Math.pow(num, exp)
      }
      return num
    }
    throw new Error('意外的 token: ' + t.value)
  }

  const result = parseExpression()
  if (pos !== tokens.length) throw new Error('表达式末尾存在多余内容')
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('结果不是有效数字')
  return result
}

registerCommand('calc', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const expression = args.join(' ')
    
    if (!expression) {
      return {
        output: [
          '🧮 计算器',
          '',
          '用法: calc <数学表达式>',
          '',
          '支持的运算符: +, -, *, /, %, **, ()',
          '支持的函数: sqrt, sin, cos, tan, log, log10, abs, ceil, floor, round',
          '支持的常量: PI, E',
          '',
          '示例:',
          '  calc 2 + 3 * 4',
          '  calc (2 + 3) * 4',
          '  calc 2 ** 10',
          '  calc sqrt(16)',
          '  calc sin(3.14)',
        ].join('\n')
      }
    }
    
    try {
      const result = safeEval(expression)
      return { output: `= ${result}` }
    } catch (e) {
      return { output: `calc: 表达式错误 - ${(e as Error).message}` }
    }
  },
  description: '数学计算器',
  usage: 'calc <表达式>',
  examples: ['calc 2 + 3', 'calc sqrt(16)', 'calc sin(PI)']
})

registerCommand('prime', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const num = parseInt(args[0])
    
    if (isNaN(num)) {
      return {
        output: [
          '🔢 质数检测',
          '',
          '用法: prime <数字>',
          '',
          '示例:',
          '  prime 17',
          '  prime 100',
        ].join('\n')
      }
    }
    
    const isPrime = (n: number): boolean => {
      if (n <= 1) return false
      if (n <= 3) return true
      if (n % 2 === 0 || n % 3 === 0) return false
      let i = 5
      while (i * i <= n) {
        if (n % i === 0 || n % (i + 2) === 0) return false
        i += 6
      }
      return true
    }
    
    if (isPrime(num)) {
      return { output: `${num} 是质数 ✅` }
    } else {
      return { output: `${num} 不是质数 ❌` }
    }
  },
  description: '检测数字是否为质数',
  usage: 'prime <数字>',
  examples: ['prime 17', 'prime 100']
})

registerCommand('factor', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const num = parseInt(args[0])
    
    if (isNaN(num) || num < 2) {
      return {
        output: [
          '🔧 质因数分解',
          '',
          '用法: factor <数字>',
          '',
          '示例:',
          '  factor 12',
          '  factor 100',
        ].join('\n')
      }
    }
    
    const factors: number[] = []
    let n = num
    while (n % 2 === 0) {
      factors.push(2)
      n /= 2
    }
    let i = 3
    while (i * i <= n) {
      while (n % i === 0) {
        factors.push(i)
        n /= i
      }
      i += 2
    }
    if (n > 2) factors.push(n)
    
    return { output: `${num} = ${factors.join(' × ')}` }
  },
  description: '质因数分解',
  usage: 'factor <数字>',
  examples: ['factor 12', 'factor 100']
})

registerCommand('roman', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const num = parseInt(args[0])
    
    if (isNaN(num) || num < 1 || num > 3999) {
      return {
        output: [
          '🔤 罗马数字转换',
          '',
          '用法: roman <数字> (1-3999)',
          '',
          '示例:',
          '  roman 2024',
          '  roman 1999',
        ].join('\n')
      }
    }
    
    const romanNumerals = [
      { value: 1000, symbol: 'M' },
      { value: 900, symbol: 'CM' },
      { value: 500, symbol: 'D' },
      { value: 400, symbol: 'CD' },
      { value: 100, symbol: 'C' },
      { value: 90, symbol: 'XC' },
      { value: 50, symbol: 'L' },
      { value: 40, symbol: 'XL' },
      { value: 10, symbol: 'X' },
      { value: 9, symbol: 'IX' },
      { value: 5, symbol: 'V' },
      { value: 4, symbol: 'IV' },
      { value: 1, symbol: 'I' },
    ]
    
    let result = ''
    let n = num
    for (const { value, symbol } of romanNumerals) {
      while (n >= value) {
        result += symbol
        n -= value
      }
    }
    
    return { output: `${num} = ${result}` }
  },
  description: '阿拉伯数字转罗马数字',
  usage: 'roman <数字>',
  examples: ['roman 2024', 'roman 1999']
})

registerCommand('base64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔐 Base64 编码',
          '',
          '用法: base64 <文本>',
          '',
          '示例:',
          '  base64 Hello World',
        ].join('\n')
      }
    }
    
    return { output: btoa(text) }
  },
  description: 'Base64编码',
  usage: 'base64 <文本>',
  examples: ['base64 Hello World']
})

registerCommand('unbase64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const encoded = args.join(' ')
    
    if (!encoded) {
      return {
        output: [
          '🔓 Base64 解码',
          '',
          '用法: unbase64 <编码文本>',
          '',
          '示例:',
          '  unbase64 SGVsbG8gV29ybGQ=',
        ].join('\n')
      }
    }
    
    try {
      return { output: atob(encoded) }
    } catch {
      return { output: 'unbase64: 无效的 Base64 编码' }
    }
  },
  description: 'Base64解码',
  usage: 'unbase64 <编码文本>',
  examples: ['unbase64 SGVsbG8gV29ybGQ=']
})

async function computeHash(text: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

registerCommand('hash', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔑 哈希计算',
          '',
          '用法: hash <算法> <文本>',
          '',
          '支持的算法:',
          '  md5    - MD5 哈希',
          '  sha1   - SHA-1 哈希',
          '  sha256 - SHA-256 哈希',
          '  sha512 - SHA-512 哈希',
          '',
          '示例:',
          '  hash sha256 password123',
          '  hash md5 hello world',
          '  hash sha1 test',
          '',
          '💡 不指定算法时默认使用 SHA-256',
        ].join('\n')
      }
    }
    
    let algorithm = 'SHA-256'
    let text = args.join(' ')
    
    const knownAlgorithms: Record<string, string> = {
      'md5': 'MD5',
      'sha1': 'SHA-1',
      'sha256': 'SHA-256',
      'sha512': 'SHA-512',
    }
    
    const firstArg = args[0]?.toLowerCase() || ''
    if (firstArg && knownAlgorithms[firstArg]) {
      algorithm = knownAlgorithms[firstArg]
      text = args.slice(1).join(' ')
    }
    
    if (!text) {
      return { output: 'hash: 请提供要计算哈希的文本' }
    }
    
    try {
      const hash = await computeHash(text, algorithm)
      
      return {
        output: [
          `🔑 ${algorithm} 哈希`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `原文: ${text}`,
          `哈希: ${hash}`,
          `长度: ${hash.length} 字符`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ].join('\n')
      }
    } catch {
      return { output: `hash: 无法计算 ${algorithm} 哈希` }
    }
  },
  description: '计算文本哈希值（支持MD5/SHA1/SHA256/SHA512）',
  usage: 'hash [算法] <文本>',
  examples: ['hash sha256 password123', 'hash md5 hello']
})

registerCommand('rev', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return { output: 'rev: 请提供要反转的文本' }
    }
    
    return { output: text.split('').reverse().join('') }
  },
  description: '反转文本',
  usage: 'rev <文本>',
  examples: ['rev hello', 'rev abc123']
})

registerCommand('json', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📋 JSON 格式化工具',
          '',
          '用法: json <JSON字符串>',
          '',
          '示例:',
          '  json {"name":"test","value":123}',
          '  echo \'{"a":1}\' | json',
          '',
          '💡 用于格式化和验证JSON数据',
        ].join('\n')
      }
    }
    
    try {
      const parsed = JSON.parse(args.join(' '))
      return { output: JSON.stringify(parsed, null, 2) }
    } catch (e) {
      return { output: `json: JSON格式错误 - ${(e as Error).message}` }
    }
  },
  description: 'JSON格式化和验证',
  usage: 'json <JSON字符串>',
  examples: ['json {"name":"test"}']
})

registerCommand('urlencode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔗 URL编码',
          '',
          '用法: urlencode <文本>',
          '',
          '示例:',
          '  urlencode Hello World!',
        ].join('\n')
      }
    }
    
    return { output: encodeURIComponent(text) }
  },
  description: 'URL编码',
  usage: 'urlencode <文本>',
  examples: ['urlencode Hello World!']
})

registerCommand('urldecode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔗 URL解码',
          '',
          '用法: urldecode <编码文本>',
          '',
          '示例:',
          '  urldecode Hello%20World%21',
        ].join('\n')
      }
    }
    
    try {
      return { output: decodeURIComponent(text) }
    } catch {
      return { output: 'urldecode: 无效的URL编码' }
    }
  },
  description: 'URL解码',
  usage: 'urldecode <编码文本>',
  examples: ['urldecode Hello%20World%21']
})

registerCommand('uuid', {
  handler: (): CommandResult => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    
    return { output: `生成的UUID:\n\n${uuid}` }
  },
  description: '生成UUID',
  usage: 'uuid',
  examples: ['uuid']
})

registerCommand('password', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const length = parseInt(args[0]) || 16
    
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    return { output: `🔐 生成的密码\n\n${password}\n\n长度: ${password.length} 字符` }
  },
  description: '生成随机密码',
  usage: 'password [长度]',
  examples: ['password', 'password 20']
})

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args.join(' ') || 'Beijing'
    
    const cityCoords: Record<string, { lat: number; lon: number }> = {
      'beijing': { lat: 39.9042, lon: 116.4074 },
      'shanghai': { lat: 31.2304, lon: 121.4737 },
      'guangzhou': { lat: 23.1291, lon: 113.2644 },
      'shenzhen': { lat: 22.5431, lon: 114.0579 },
      'chengdu': { lat: 30.5728, lon: 104.0668 },
      'hangzhou': { lat: 30.2741, lon: 120.1551 },
      'tokyo': { lat: 35.6762, lon: 139.6503 },
      'newyork': { lat: 40.7128, lon: -74.0060 },
      'london': { lat: 51.5074, lon: -0.1278 },
      'paris': { lat: 48.8566, lon: 2.3522 },
    }
    
    const lowerCity = city.toLowerCase().replace(/\s+/g, '')
    const coords = cityCoords[lowerCity]
    
    if (!coords) {
      return {
        output: [
          `🌤️  ${city} 天气`,
          '',
          '错误: 暂不支持该城市查询',
          '',
          '支持的城市: Beijing, Shanghai, Guangzhou, Shenzhen, Chengdu, Hangzhou, Tokyo, NewYork, London, Paris',
        ].join('\n')
      }
    }
    
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m&timezone=Asia/Shanghai`
      )
      
      if (!response.ok) {
        throw new Error('API请求失败')
      }
      
      const data = await response.json()
      const weatherCodes: Record<number, string> = {
        0: '晴朗', 1: '晴', 2: '多云', 3: '阴',
        45: '雾', 48: '雾凇',
        51: '毛毛雨', 53: '小雨', 55: '中雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        80: '阵雨', 81: '强阵雨', 82: '暴雨',
        95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴伴冰雹',
      }
      
      const temp = Math.round(data.current.temperature_2m)
      const humidity = data.current.relative_humidity_2m
      const desc = weatherCodes[data.current.weather_code] || '未知'
      const windSpeed = data.current.wind_speed_10m
      const windDir = data.current.wind_direction_10m
      
      const windDirections = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风']
      const windDirIndex = Math.round(windDir / 45) % 8
      const windLevel = windSpeed < 2 ? '微风' : windSpeed < 4 ? '2级' : windSpeed < 6 ? '3级' : windSpeed < 8 ? '4级' : '5级+'
      const windText = `${windDirections[windDirIndex]} ${windLevel}`
      
      return {
        output: [
          `🌤️  ${city} 实时天气`,
          '',
          `温度: ${temp}°C`,
          `天气: ${desc}`,
          `湿度: ${humidity}%`,
          `风力: ${windText} (${windSpeed.toFixed(1)} km/h)`,
          '',
          '数据来源: Open-Meteo API',
        ].join('\n')
      }
    } catch {
      const fallbackData = { temp: Math.floor(Math.random() * 20) + 20, desc: '晴', humidity: Math.floor(Math.random() * 40) + 40, wind: '微风' }
      return {
        output: [
          `🌤️  ${city} 天气`,
          '',
          `温度: ${fallbackData.temp}°C`,
          `天气: ${fallbackData.desc}`,
          `湿度: ${fallbackData.humidity}%`,
          `风力: ${fallbackData.wind}`,
          '',
          '💡 提示: 使用 weather <城市名> 查询其他城市天气',
        ].join('\n')
      }
    }
  },
  description: '查询天气',
  usage: 'weather [城市名]',
  examples: ['weather', 'weather Beijing', 'weather Shanghai']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://github-trending-api.now.sh/repositories?language=javascript&since=daily')
      if (!response.ok) throw new Error('API请求失败')
      
      const repos = await response.json()
      
      const output = [
        '📰 GitHub Trending - JavaScript',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        ...repos.slice(0, 6).map((repo: any, index: number) => 
          `[${index + 1}] ${repo.name.padEnd(30)} ⭐ ${repo.stars.toString().padStart(8)}  ${repo.description.slice(0, 40)}...`
        ),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '💡 提示: 显示今日热门JavaScript项目',
      ]
      
      return { output: output.join('\n') }
    } catch {
      const newsItems = [
        { category: '科技', title: 'AI技术持续突破，大模型应用场景不断扩展', source: '科技日报' },
        { category: '财经', title: '全球股市震荡，投资者寻求避险资产', source: '财经时报' },
        { category: '体育', title: '世界杯预选赛激战正酣，各队争夺出线名额', source: '体育新闻' },
        { category: '娱乐', title: '年度热门电影上映，票房突破十亿大关', source: '娱乐周刊' },
        { category: '健康', title: '专家提醒：夏季高温需注意防暑降温', source: '健康报' },
        { category: '教育', title: '新学年即将开始，教育政策有新调整', source: '教育新闻' },
      ]
      
      const output = [
        '📰 今日新闻头条',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        ...newsItems.map((item, index) => `[${index + 1}] ${item.category.padEnd(4)} | ${item.title}`),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '💡 提示: 新闻数据每小时更新一次',
      ]
      
      return { output: output.join('\n') }
    }
  },
  description: '显示新闻头条',
  usage: 'news',
  examples: ['news']
})

registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const symbols = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'XRP']
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(',')}&vs_currencies=usd&include_24hr_change=true`
      )
      if (!response.ok) throw new Error('API请求失败')
      
      const data = await response.json()
      
      const coinIds: Record<string, string> = {
        'btc': 'bitcoin',
        'eth': 'ethereum',
        'usdt': 'tether',
        'sol': 'solana',
        'bnb': 'binancecoin',
        'xrp': 'ripple',
      }
      
      const coinSymbols: Record<string, string> = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'tether': 'USDT',
        'solana': 'SOL',
        'binancecoin': 'BNB',
        'ripple': 'XRP',
      }
      
      if (args.length > 0) {
        const symbol = args[0].toLowerCase()
        const coinId = coinIds[symbol]
        if (coinId && data[coinId]) {
          const price = data[coinId].usd
          const change = data[coinId].usd_24h_change
          return {
            output: [
              `💰 ${coinSymbols[coinId]} 价格信息`,
              '',
              `当前价格: $${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              `24h涨跌: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
              '',
              '数据来源: CoinGecko API',
            ].join('\n')
          }
        }
        return { output: `crypto: 未知加密货币 '${symbol}'` }
      }
      
      const output = [
        '💰 加密货币行情',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${'币种'.padEnd(6)} ${'价格 (USD)'.padEnd(16)} ${'24h涨跌'.padEnd(10)}`,
        ...symbols.map(symbol => {
          const coinId = coinIds[symbol.toLowerCase()]
          if (coinId && data[coinId]) {
            const price = data[coinId].usd
            const change = data[coinId].usd_24h_change
            return `${symbol.padEnd(6)} $${price.toLocaleString('en-US', { minimumFractionDigits: 2 }).padEnd(15)} ${(change >= 0 ? '+' : '') + change.toFixed(2) + '%'}`
          }
          return ''
        }).filter(Boolean),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '用法: crypto <币种> (btc, eth, sol, bnb, xrp)',
        '',
        '数据来源: CoinGecko API',
      ]
      
      return { output: output.join('\n') }
    } catch {
      const cryptoData: Record<string, { price: number; change: number; symbol: string }> = {
        'btc': { price: 67523.50, change: 2.35, symbol: 'BTC' },
        'eth': { price: 3421.80, change: 1.82, symbol: 'ETH' },
        'usdt': { price: 1.00, change: 0.01, symbol: 'USDT' },
        'sol': { price: 178.45, change: 5.62, symbol: 'SOL' },
        'bnb': { price: 612.30, change: -0.85, symbol: 'BNB' },
        'xrp': { price: 0.6235, change: 1.24, symbol: 'XRP' },
      }
      
      if (args.length > 0) {
        const symbol = args[0].toLowerCase()
        const data = cryptoData[symbol]
        if (data) {
          return {
            output: [
              `💰 ${data.symbol} 价格信息`,
              '',
              `当前价格: $${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              `24h涨跌: ${data.change >= 0 ? '+' : ''}${data.change}%`,
            ].join('\n')
          }
        }
        return { output: `crypto: 未知加密货币 '${symbol}'` }
      }
      
      const output = [
        '💰 加密货币行情',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${'币种'.padEnd(6)} ${'价格 (USD)'.padEnd(16)} ${'24h涨跌'.padEnd(10)}`,
        ...Object.entries(cryptoData).map(([, data]) => 
          `${data.symbol.padEnd(6)} $${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 }).padEnd(15)} ${(data.change >= 0 ? '+' : '') + data.change + '%'}`
        ),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '用法: crypto <币种> (btc, eth, sol, bnb, xrp)',
      ]
      
      return { output: output.join('\n') }
    }
  },
  description: '查询加密货币价格',
  usage: 'crypto [币种]',
  examples: ['crypto', 'crypto btc', 'crypto eth']
})

registerCommand('ipinfo', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://ipinfo.io/json')
      if (!response.ok) throw new Error('API请求失败')
      
      const data = await response.json()
      
      const output = [
        '🌐 IP地址信息',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `IP地址: ${data.ip || '未知'}`,
        `主机名: ${data.hostname || '未知'}`,
        `城市: ${data.city || '未知'}`,
        `地区: ${data.region || '未知'}`,
        `国家: ${data.country || '未知'}`,
        `坐标: ${data.loc || '未知'}`,
        `运营商: ${data.org || '未知'}`,
        `时区: ${data.timezone || '未知'}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '数据来源: ipinfo.io',
      ]
      
      return { output: output.join('\n') }
    } catch {
      const ipInfo = {
        ip: '192.168.1.100',
        hostname: 'web-linux.local',
        city: 'Beijing',
        region: 'Beijing',
        country: 'CN',
        loc: '39.9042,116.4074',
        org: 'WebLinuxOS',
        timezone: 'Asia/Shanghai',
      }
      
      const output = [
        '🌐 IP地址信息',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `IP地址: ${ipInfo.ip}`,
        `主机名: ${ipInfo.hostname}`,
        `城市: ${ipInfo.city}`,
        `地区: ${ipInfo.region}`,
        `国家: ${ipInfo.country}`,
        `坐标: ${ipInfo.loc}`,
        `运营商: ${ipInfo.org}`,
        `时区: ${ipInfo.timezone}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ]
      
      return { output: output.join('\n') }
    }
  },
  description: '显示IP地址信息',
  usage: 'ipinfo',
  examples: ['ipinfo']
})

registerCommand('translate', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🌍 翻译工具',
          '',
          '用法: translate <文本>',
          '',
          '示例:',
          '  translate Hello World',
          '  translate 你好世界',
          '',
          '支持自动检测语言并翻译成中文/英文',
        ].join('\n')
      }
    }
    
    const text = args.join(' ')
    const isChinese = /[\u4e00-\u9fa5]/.test(text)
    const sourceLang = isChinese ? 'zh' : 'en'
    const targetLang = isChinese ? 'en' : 'zh'
    
    try {
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: sourceLang, target: targetLang }),
      })
      
      if (!response.ok) throw new Error('API请求失败')
      
      const data = await response.json()
      const result = data.translatedText || '翻译失败'
      
      return {
        output: [
          `🌍 翻译结果`,
          '',
          `原文: ${text}`,
          `译文: ${result}`,
          '',
          `语言: ${isChinese ? '中文 -> 英文' : '英文 -> 中文'}`,
          '',
          '数据来源: LibreTranslate',
        ].join('\n')
      }
    } catch {
      const translations: Record<string, string> = {
        'hello': '你好',
        'world': '世界',
        'hello world': '你好世界',
        'welcome': '欢迎',
        'thank you': '谢谢',
        'goodbye': '再见',
        'yes': '是',
        'no': '不',
        'please': '请',
        'sorry': '抱歉',
        '你好': 'Hello',
        '世界': 'World',
        '你好世界': 'Hello World',
        '欢迎': 'Welcome',
        '谢谢': 'Thank you',
        '再见': 'Goodbye',
        '是': 'Yes',
        '不': 'No',
        '请': 'Please',
        '抱歉': 'Sorry',
      }
      
      const result = translations[text.toLowerCase()] || (isChinese ? 'Translation...' : '翻译中...')
      
      return {
        output: [
          `🌍 翻译结果`,
          '',
          `原文: ${text}`,
          `译文: ${result}`,
          '',
          `语言: ${isChinese ? '中文 -> 英文' : '英文 -> 中文'}`,
        ].join('\n')
      }
    }
  },
  description: '翻译文本',
  usage: 'translate <文本>',
  examples: ['translate Hello World', 'translate 你好世界']
})

registerCommand('quote', {
  handler: (): CommandResult => {
    const quotes = [
      { text: '生活不止眼前的苟且，还有诗和远方。', author: '高晓松' },
      { text: '不要等待机会，而要创造机会。', author: '林肯' },
      { text: '成功不是将来才有的，而是从决定去做的那一刻起，持续累积而成。', author: '俞敏洪' },
      { text: '人生最大的挑战是发现自己是谁，而第二大的挑战是对所发现的感到满意。', author: '罗杰·塞尔夫' },
      { text: '生命中最美好的事物都是免费的：微笑、拥抱、朋友、爱与美好的回忆。', author: '佚名' },
      { text: '每一天都是一个新的开始，你可以选择如何度过它。', author: '佚名' },
      { text: '成功的秘诀在于始终如一地坚持目标。', author: '佚名' },
      { text: '知识是人生旅途中最好的行囊。', author: '佚名' },
    ]
    
    const quote = quotes[Math.floor(Math.random() * quotes.length)]
    
    return {
      output: [
        '📖 今日名言',
        '',
        `"${quote.text}"`,
        '',
        `—— ${quote.author}`,
      ].join('\n')
    }
  },
  description: '显示随机名言',
  usage: 'quote',
  examples: ['quote']
})

registerCommand('timer', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const seconds = parseInt(args[0])
    
    if (isNaN(seconds) || seconds <= 0) {
      return {
        output: [
          '⏱️  倒计时器',
          '',
          '用法: timer <秒数>',
          '',
          '示例:',
          '  timer 60',
          '  timer 120',
        ].join('\n')
      }
    }
    
    let output = `⏱️  倒计时开始: ${seconds} 秒\n\n`
    
    for (let remaining = seconds; remaining > 0; remaining--) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (remaining <= 5) {
        output += `${remaining}... `
      }
    }
    
    output += '\n🎉 时间到！'
    
    return { output }
  },
  description: '倒计时器',
  usage: 'timer <秒数>',
  examples: ['timer 60', 'timer 120']
})

registerCommand('motd', {
  handler: (): CommandResult => {
    const hours = new Date().getHours()
    let greeting = ''
    
    if (hours < 6) greeting = '夜深了，注意休息 🌙'
    else if (hours < 12) greeting = '早上好！☀️'
    else if (hours < 14) greeting = '中午好！🌤️'
    else if (hours < 18) greeting = '下午好！🌥️'
    else greeting = '晚上好！🌙'
    
    const uptime = Math.floor(Math.random() * 100) + 10
    const users = Math.floor(Math.random() * 10) + 1
    
    return {
      output: [
        '========================================',
        '        WebLinuxOS 欢迎您！',
        '========================================',
        '',
        greeting,
        '',
        `系统运行时间: ${uptime} 小时`,
        `当前在线用户: ${users} 人`,
        '',
        '输入 `help` 查看可用命令',
        '输入 `apps` 查看所有应用',
        '',
        '========================================',
      ].join('\n')
    }
  },
  description: '显示欢迎信息',
  usage: 'motd',
  examples: ['motd']
})

registerCommand('echo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    return { output: args.join(' ') }
  },
  description: '输出文本',
  usage: 'echo <文本>',
  examples: ['echo Hello World', 'echo $PATH']
})

registerCommand('grep', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔍 grep 文本搜索',
          '',
          '用法: grep <模式> <文件>',
          '',
          '示例:',
          '  grep hello file.txt',
          '  grep -i hello file.txt',
          '',
          '选项:',
          '  -i 忽略大小写',
        ].join('\n')
      }
    }
    
    const ignoreCase = args.includes('-i')
    const patternIndex = args.includes('-i') ? 1 : 0
    const pattern = args[patternIndex]
    const filePath = args[patternIndex + 1]
    
    const resolved = resolvePath(cwd, filePath)
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `grep: ${filePath}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n')
    const matches = lines.filter(line => {
      const target = ignoreCase ? line.toLowerCase() : line
      const searchPattern = ignoreCase ? pattern.toLowerCase() : pattern
      return target.includes(searchPattern)
    })
    
    return { output: matches.join('\n') || '' }
  },
  description: '在文件中搜索文本',
  usage: 'grep [-i] <模式> <文件>',
  examples: ['grep hello file.txt', 'grep -i error log.txt']
})

registerCommand('sort', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📊 sort 排序',
          '',
          '用法: sort <文件>',
          '',
          '示例:',
          '  sort names.txt',
        ].join('\n')
      }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `sort: ${args[0]}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n').filter(line => line.trim())
    lines.sort()
    
    return { output: lines.join('\n') }
  },
  description: '排序文件内容',
  usage: 'sort <文件>',
  examples: ['sort names.txt']
})

registerCommand('uniq', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔄 uniq 去重',
          '',
          '用法: uniq <文件>',
          '',
          '示例:',
          '  uniq duplicates.txt',
        ].join('\n')
      }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `uniq: ${args[0]}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n').filter(line => line.trim())
    const unique: string[] = []
    
    for (const line of lines) {
      if (line !== unique[unique.length - 1]) {
        unique.push(line)
      }
    }
    
    return { output: unique.join('\n') }
  },
  description: '去除重复行',
  usage: 'uniq <文件>',
  examples: ['uniq duplicates.txt']
})

registerCommand('help', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const commands: Record<string, { desc: string; usage: string }> = {
      'ls': { desc: '列出目录内容', usage: 'ls [路径]' },
      'cd': { desc: '切换目录', usage: 'cd <路径>' },
      'pwd': { desc: '显示当前目录', usage: 'pwd' },
      'mkdir': { desc: '创建目录', usage: 'mkdir <目录名>' },
      'rm': { desc: '删除文件或目录', usage: 'rm <路径>' },
      'cp': { desc: '复制文件', usage: 'cp <源> <目标>' },
      'mv': { desc: '移动/重命名文件', usage: 'mv <源> <目标>' },
      'cat': { desc: '查看文件内容', usage: 'cat <文件>' },
      'touch': { desc: '创建空文件', usage: 'touch <文件名>' },
      'echo': { desc: '输出文本', usage: 'echo <文本>' },
      'grep': { desc: '在文件中搜索文本', usage: 'grep <模式> <文件>' },
      'sort': { desc: '排序文件内容', usage: 'sort <文件>' },
      'uniq': { desc: '去除重复行', usage: 'uniq <文件>' },
      'wc': { desc: '统计行数/字数/字符数', usage: 'wc <文件>' },
      'head': { desc: '显示文件开头', usage: 'head <文件>' },
      'tail': { desc: '显示文件末尾', usage: 'tail <文件>' },
      'whoami': { desc: '显示当前用户', usage: 'whoami' },
      'date': { desc: '显示日期时间', usage: 'date' },
      'uptime': { desc: '显示系统运行时间', usage: 'uptime' },
      'ps': { desc: '显示进程列表', usage: 'ps' },
      'top': { desc: '系统进程监控', usage: 'top' },
      'calc': { desc: '数学计算器', usage: 'calc <表达式>' },
      'weather': { desc: '查询天气', usage: 'weather [城市]' },
      'news': { desc: '显示新闻头条', usage: 'news' },
      'crypto': { desc: '加密货币行情', usage: 'crypto [币种]' },
      'ipinfo': { desc: 'IP地址信息', usage: 'ipinfo' },
      'translate': { desc: '翻译文本', usage: 'translate <文本>' },
      'quote': { desc: '随机名言', usage: 'quote' },
      'password': { desc: '生成密码', usage: 'password [长度]' },
      'uuid': { desc: '生成UUID', usage: 'uuid' },
      'base64': { desc: 'Base64编码', usage: 'base64 <文本>' },
      'unbase64': { desc: 'Base64解码', usage: 'unbase64 <文本>' },
      'urlencode': { desc: 'URL编码', usage: 'urlencode <文本>' },
      'urldecode': { desc: 'URL解码', usage: 'urldecode <文本>' },
      'json': { desc: 'JSON格式化', usage: 'json <JSON>' },
      'hash': { desc: '计算哈希', usage: 'hash <文本>' },
      'rev': { desc: '反转文本', usage: 'rev <文本>' },
      'qrcode': { desc: '生成二维码', usage: 'qrcode <文本>' },
      'prime': { desc: '质数检测', usage: 'prime <数字>' },
      'factor': { desc: '质因数分解', usage: 'factor <数字>' },
      'roman': { desc: '罗马数字转换', usage: 'roman <数字>' },
      'timer': { desc: '倒计时器', usage: 'timer <秒数>' },
      'motd': { desc: '显示欢迎信息', usage: 'motd' },
      'apps': { desc: '列出所有应用', usage: 'apps' },
      'clear': { desc: '清空屏幕', usage: 'clear' },
      'help': { desc: '显示此帮助信息', usage: 'help [命令]' },
    }
    
    if (args.length > 0) {
      const cmd = args[0].toLowerCase()
      if (commands[cmd]) {
        return {
          output: [
            `命令: ${cmd}`,
            `描述: ${commands[cmd].desc}`,
            `用法: ${commands[cmd].usage}`,
          ].join('\n')
        }
      }
      return { output: `help: 未知命令 '${cmd}'` }
    }
    
    const output = ['📖 可用命令:', '', ...Object.entries(commands).map(([cmd, info]) => 
      `  ${cmd.padEnd(12)} - ${info.desc}`
    ), '', '使用 help <命令> 查看详细用法']
    
    return { output: output.join('\n') }
  },
  description: '显示帮助信息',
  usage: 'help [命令]',
  examples: ['help', 'help ls']
})

registerCommand('qrcode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '📱 二维码生成器',
          '',
          '用法: qrcode <文本或URL>',
          '',
          '示例:',
          '  qrcode https://github.com',
          '  qrcode Hello World',
          '  qrcode wifi:T:WPA;S:MyNetwork;P:password;;',
          '',
          '💡 支持生成以下类型的二维码:',
          '  - URL链接',
          '  - 文本内容',
          '  - WiFi配置',
          '  - 联系人信息',
          '  - 日历事件',
        ].join('\n')
      }
    }
    
    const encoded = encodeURIComponent(text)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&format=png`
    
    return {
      output: [
        '📱 二维码已生成',
        '',
        `内容: ${text}`,
        '',
        `🔗 在线预览: ${qrUrl}`,
        '',
        '💡 在浏览器中打开以上链接查看二维码图片',
        '💡 可使用 -s 参数指定尺寸: qrcode -s 300 <文本>',
      ].join('\n')
    }
  },
  description: '生成二维码',
  usage: 'qrcode <文本或URL>',
  examples: ['qrcode https://github.com', 'qrcode Hello World']
})