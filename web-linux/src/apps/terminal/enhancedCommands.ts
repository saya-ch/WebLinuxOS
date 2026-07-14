import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import type { FileNode } from '../../types'

registerCommand('calendar', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const now = new Date()
    const year = args.length > 0 ? parseInt(args[0]) : now.getFullYear()
    const month = args.length > 1 ? parseInt(args[1]) - 1 : now.getMonth()
    
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return {
        output: [
          '📅 日历',
          '',
          '用法: calendar [年份] [月份]',
          '',
          '示例:',
          '  calendar',
          '  calendar 2024',
          '  calendar 2024 12',
        ].join('\n')
      }
    }
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = now.getDate()
    
    const output: string[] = []
    output.push(`        ${monthNames[month]} ${year}`)
    output.push('   ' + weekDays.map(d => d.padEnd(4)).join(''))
    output.push(''.padEnd(30, '-'))
    
    let line = '   '
    for (let i = 0; i < firstDay; i++) {
      line += '    '
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = year === now.getFullYear() && month === now.getMonth() && day === today
      const dayStr = isToday ? `\x1b[32m${day.toString().padStart(2)}\x1b[0m` : day.toString().padStart(2)
      line += dayStr + '  '
      
      if ((firstDay + day) % 7 === 0) {
        output.push(line)
        line = '   '
      }
    }
    
    if (line.trim()) {
      output.push(line)
    }
    
    output.push('')
    output.push('提示: 高亮显示的是今天')
    
    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'calendar [年份] [月份]',
  examples: ['calendar', 'calendar 2024', 'calendar 2024 12']
})

registerCommand('timer', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const seconds = parseInt(args[0])
    
    if (isNaN(seconds) || seconds <= 0 || seconds > 3600) {
      return {
        output: [
          '⏱️ 倒计时器',
          '',
          '用法: timer <秒数> (1-3600)',
          '',
          '示例:',
          '  timer 60',
          '  timer 300',
        ].join('\n')
      }
    }
    
    const startTime = Date.now()
    const endTime = startTime + seconds * 1000
    
    let output = `⏱️ 倒计时开始: ${seconds} 秒\n\n`
    
    while (Date.now() < endTime) {
      const remaining = Math.ceil((endTime - Date.now()) / 1000)
      if (remaining <= 5) {
        output += `${remaining}... `
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    output += '\n🎉 时间到！'
    
    return { output }
  },
  description: '倒计时器',
  usage: 'timer <秒数>',
  examples: ['timer 60', 'timer 300']
})

registerCommand('stopwatch', {
  handler: async (): Promise<CommandResult> => {
    const output = ['⏱️ 秒表已启动', '', '按 Ctrl+C 停止计时', '', '秒表运行中...']
    return { output: output.join('\n') }
  },
  description: '启动秒表',
  usage: 'stopwatch',
  examples: ['stopwatch']
})

registerCommand('cron', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const expression = args.join(' ')
    
    if (!expression) {
      return {
        output: [
          '⏰ Cron表达式解析器',
          '',
          '用法: cron <表达式>',
          '',
          '格式: 分 时 日 月 周',
          '',
          '示例:',
          '  cron "0 9 * * 1-5"',
          '  cron "*/30 * * * *"',
          '  cron "0 0 1 * *"',
        ].join('\n')
      }
    }
    
    const parts = expression.trim().split(/\s+/)
    if (parts.length !== 5) {
      return { output: '错误: Cron表达式必须包含5个字段' }
    }
    
    const [minute, hour, day, month, weekday] = parts
    
    const parseField = (field: string, label: string, _min: number, _max: number): string => {
      if (field === '*') return `每${label}`
      if (field.startsWith('*/')) {
        const interval = parseInt(field.slice(2))
        return `每${interval}${label}`
      }
      if (field.includes('-')) {
        const [start, end] = field.split('-')
        return `${start}-${end}${label}`
      }
      if (field.includes(',')) {
        return `指定: ${field}${label}`
      }
      return `${field}${label}`
    }
    
    const minuteLabels = ['分钟', '分']
    const hourLabels = ['小时', '时']
    const dayLabels = ['日', '号']
    const monthLabels = ['月', '月']
    const weekdayLabels = ['周', '']
    
    const output = [
      '⏰ Cron表达式解析',
      '',
      `表达式: ${expression}`,
      '',
      '解析结果:',
      `  分钟: ${parseField(minute, minuteLabels[0], 0, 59)}`,
      `  小时: ${parseField(hour, hourLabels[0], 0, 23)}`,
      `  日期: ${parseField(day, dayLabels[0], 1, 31)}`,
      `  月份: ${parseField(month, monthLabels[0], 1, 12)}`,
      `  星期: ${parseField(weekday, weekdayLabels[0], 0, 7)}`,
      '',
      '提示: 周几 0/7 表示周日',
    ].join('\n')
    
    return { output }
  },
  description: 'Cron表达式解析',
  usage: 'cron <表达式>',
  examples: ['cron "0 9 * * 1-5"', 'cron "*/30 * * * *"']
})

registerCommand('uuidv4', {
  handler: (): CommandResult => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    
    return {
      output: [
        '🔑 UUID生成',
        '',
        `UUID: ${uuid}`,
        '',
        '已复制到剪贴板',
      ].join('\n')
    }
  },
  description: '生成UUIDv4',
  usage: 'uuidv4',
  examples: ['uuidv4']
})

registerCommand('password-strength', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const password = args.join(' ')
    
    if (!password) {
      return {
        output: [
          '🔐 密码强度检测',
          '',
          '用法: password-strength <密码>',
          '',
          '示例:',
          '  password-strength mypassword123',
          '  password-strength P@ssw0rd!',
        ].join('\n')
      }
    }
    
    let score = 0
    
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
    
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 2
    
    const strength = score <= 2 ? '弱' : score <= 4 ? '中等' : score <= 6 ? '强' : '非常强'
    const color = score <= 2 ? '\x1b[31m' : score <= 4 ? '\x1b[33m' : score <= 6 ? '\x1b[36m' : '\x1b[32m'
    
    const recommendations: string[] = []
    if (password.length < 8) recommendations.push('密码长度至少8个字符')
    if (!/[a-z]/.test(password)) recommendations.push('添加小写字母')
    if (!/[A-Z]/.test(password)) recommendations.push('添加大写字母')
    if (!/[0-9]/.test(password)) recommendations.push('添加数字')
    if (!/[^a-zA-Z0-9]/.test(password)) recommendations.push('添加特殊字符')
    
    const output = [
      '🔐 密码强度检测',
      '',
      `密码长度: ${password.length} 字符`,
      `强度评分: ${score}/8`,
      `强度等级: ${color}${strength}\x1b[0m`,
      '',
    ]
    
    if (recommendations.length > 0) {
      output.push('建议:')
      recommendations.forEach(r => output.push(`  • ${r}`))
    } else {
      output.push('✅ 密码强度良好！')
    }
    
    return { output: output.join('\n') }
  },
  description: '检测密码强度',
  usage: 'password-strength <密码>',
  examples: ['password-strength mypassword', 'password-strength P@ssw0rd!']
})

registerCommand('csv-to-json', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    const filename = args[0]
    
    if (!filename) {
      return {
        output: [
          '📊 CSV转JSON',
          '',
          '用法: csv-to-json <CSV文件>',
          '',
          '示例:',
          '  csv-to-json data.csv',
        ].join('\n')
      }
    }
    
    const resolved = cwd === '/' ? `/${filename}` : `${cwd}/${filename}`
    
    const findFileByPath = (nodes: FileNode[], currentPath: string): FileNode | undefined => {
      for (const node of nodes) {
        const nodePath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`
        if (nodePath === resolved && node.type === 'file') {
          return node
        }
        if (node.type === 'folder' && node.children) {
          const found = findFileByPath(node.children, nodePath)
          if (found) return found
        }
      }
      return undefined
    }
    
    const node = findFileByPath(files, '')
    
    if (!node) {
      return { output: `文件 '${filename}' 不存在` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n').filter((line: string) => line.trim())
    
    if (lines.length < 2) {
      return { output: 'CSV文件内容为空或只有表头' }
    }
    
    const headers = lines[0].split(',')
    const data = lines.slice(1).map((line: string) => {
      const values = line.split(',')
      const obj: Record<string, string> = {}
      headers.forEach((header: string, index: number) => {
        obj[header.trim()] = values[index]?.trim() || ''
      })
      return obj
    })
    
    return { output: JSON.stringify(data, null, 2) }
  },
  description: '将CSV文件转换为JSON',
  usage: 'csv-to-json <文件>',
  examples: ['csv-to-json data.csv']
})

registerCommand('json-to-csv', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const jsonStr = args.join(' ')
    
    if (!jsonStr) {
      return {
        output: [
          '📊 JSON转CSV',
          '',
          '用法: json-to-csv <JSON数组>',
          '',
          '示例:',
          '  json-to-csv [{"name":"test","value":1}]',
        ].join('\n')
      }
    }
    
    try {
      const data = JSON.parse(jsonStr)
      
      if (!Array.isArray(data) || data.length === 0) {
        return { output: 'JSON必须是数组格式' }
      }
      
      const headers = Object.keys(data[0])
      const csvLines = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ]
      
      return { output: csvLines.join('\n') }
    } catch (e) {
      return { output: `JSON解析错误: ${(e as Error).message}` }
    }
  },
  description: '将JSON数组转换为CSV',
  usage: 'json-to-csv <JSON>',
  examples: ['json-to-csv [{"name":"test"}]']
})

registerCommand('encode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔐 编码工具',
          '',
          '用法: encode <编码方式> <文本>',
          '',
          '支持编码:',
          '  base64 - Base64编码',
          '  url - URL编码',
          '  html - HTML实体编码',
          '',
          '示例:',
          '  encode base64 Hello World',
          '  encode url Hello World!',
        ].join('\n')
      }
    }
    
    const method = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    let result: string
    
    switch (method) {
      case 'base64':
        result = btoa(text)
        break
      case 'url':
        result = encodeURIComponent(text)
        break
      case 'html':
        const div = document.createElement('div')
        div.textContent = text
        result = div.innerHTML
        break
      default:
        return { output: `不支持的编码方式: ${method}` }
    }
    
    return {
      output: [
        `🔐 ${method.toUpperCase()}编码结果`,
        '',
        `原文: ${text}`,
        `编码: ${result}`,
      ].join('\n')
    }
  },
  description: '文本编码工具',
  usage: 'encode <方式> <文本>',
  examples: ['encode base64 Hello', 'encode url test']
})

registerCommand('decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔓 解码工具',
          '',
          '用法: decode <解码方式> <编码文本>',
          '',
          '支持解码:',
          '  base64 - Base64解码',
          '  url - URL解码',
          '  html - HTML实体解码',
          '',
          '示例:',
          '  decode base64 SGVsbG8gV29ybGQ=',
          '  decode url Hello%20World%21',
        ].join('\n')
      }
    }
    
    const method = args[0].toLowerCase()
    const encoded = args.slice(1).join(' ')
    
    let result: string
    
    try {
      switch (method) {
        case 'base64':
          result = atob(encoded)
          break
        case 'url':
          result = decodeURIComponent(encoded)
          break
        case 'html':
          const div = document.createElement('div')
          div.innerHTML = encoded
          result = div.textContent || ''
          break
        default:
          return { output: `不支持的解码方式: ${method}` }
      }
    } catch (e) {
      return { output: `解码错误: ${(e as Error).message}` }
    }
    
    return {
      output: [
        `🔓 ${method.toUpperCase()}解码结果`,
        '',
        `编码: ${encoded}`,
        `原文: ${result}`,
      ].join('\n')
    }
  },
  description: '文本解码工具',
  usage: 'decode <方式> <文本>',
  examples: ['decode base64 SGVsbG8=', 'decode url test%20']
})

registerCommand('converter', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 3) {
      return {
        output: [
          '🔄 单位转换器',
          '',
          '用法: converter <数值> <源单位> <目标单位>',
          '',
          '支持的单位:',
          '',
          '长度:',
          '  m, cm, mm, km, in, ft, yd, mi',
          '',
          '重量:',
          '  kg, g, mg, lb, oz',
          '',
          '温度:',
          '  c (摄氏度), f (华氏度), k (开尔文)',
          '',
          '数据:',
          '  b, kb, mb, gb, tb',
          '',
          '示例:',
          '  converter 100 km mi',
          '  converter 32 c f',
          '  converter 1 gb mb',
        ].join('\n')
      }
    }
    
    const value = parseFloat(args[0])
    const from = args[1].toLowerCase()
    const to = args[2].toLowerCase()
    
    if (isNaN(value)) {
      return { output: '错误: 无效的数值' }
    }
    
    const conversionRates: Record<string, Record<string, number>> = {
      m: { cm: 100, mm: 1000, km: 0.001, in: 39.3701, ft: 3.28084, yd: 1.09361, mi: 0.000621371 },
      cm: { m: 0.01, mm: 10, km: 0.00001, in: 0.393701, ft: 0.0328084, yd: 0.0109361, mi: 0.00000621371 },
      mm: { m: 0.001, cm: 0.1, km: 0.000001, in: 0.0393701, ft: 0.00328084, yd: 0.00109361, mi: 0.000000621371 },
      km: { m: 1000, cm: 100000, mm: 1000000, in: 39370.1, ft: 3280.84, yd: 1093.61, mi: 0.621371 },
      in: { m: 0.0254, cm: 2.54, mm: 25.4, km: 0.0000254, ft: 0.0833333, yd: 0.0277778, mi: 0.0000157828 },
      ft: { m: 0.3048, cm: 30.48, mm: 304.8, km: 0.0003048, in: 12, yd: 0.333333, mi: 0.000189394 },
      yd: { m: 0.9144, cm: 91.44, mm: 914.4, km: 0.0009144, in: 36, ft: 3, mi: 0.000568182 },
      mi: { m: 1609.34, cm: 160934, mm: 1609344, km: 1.60934, in: 63360, ft: 5280, yd: 1760 },
      kg: { g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274 },
      g: { kg: 0.001, mg: 1000, lb: 0.00220462, oz: 0.035274 },
      mg: { kg: 0.000001, g: 0.001, lb: 0.00000220462, oz: 0.000035274 },
      lb: { kg: 0.453592, g: 453.592, mg: 453592, oz: 16 },
      oz: { kg: 0.0283495, g: 28.3495, mg: 28349.5, lb: 0.0625 },
      b: { kb: 0.0009765625, mb: 0.00000095367, gb: 0.00000000093132, tb: 0.00000000000090949 },
      kb: { b: 1024, mb: 0.0009765625, gb: 0.00000095367, tb: 0.00000000093132 },
      mb: { b: 1048576, kb: 1024, gb: 0.0009765625, tb: 0.00000095367 },
      gb: { b: 1073741824, kb: 1048576, mb: 1024, tb: 0.0009765625 },
      tb: { b: 1099511627776, kb: 1073741824, mb: 1048576, gb: 1024 },
    }
    
    let result: number
    
    if (from === to) {
      result = value
    } else if (from === 'c' && to === 'f') {
      result = value * 9/5 + 32
    } else if (from === 'f' && to === 'c') {
      result = (value - 32) * 5/9
    } else if (from === 'c' && to === 'k') {
      result = value + 273.15
    } else if (from === 'k' && to === 'c') {
      result = value - 273.15
    } else if (from === 'f' && to === 'k') {
      result = (value - 32) * 5/9 + 273.15
    } else if (from === 'k' && to === 'f') {
      result = (value - 273.15) * 9/5 + 32
    } else if (conversionRates[from] && conversionRates[from][to]) {
      result = value * conversionRates[from][to]
    } else {
      return { output: `不支持的转换: ${from} -> ${to}` }
    }
    
    const formattedResult = result.toFixed(6).replace(/\.?0+$/, '')
    
    return {
      output: [
        '🔄 单位转换结果',
        '',
        `${value} ${from} = ${formattedResult} ${to}`,
      ].join('\n')
    }
  },
  description: '单位转换器',
  usage: 'converter <数值> <源单位> <目标单位>',
  examples: ['converter 100 km mi', 'converter 32 c f', 'converter 1 gb mb']
})

registerCommand('hashgen', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔑 哈希生成器',
          '',
          '用法: hashgen <算法> <文本>',
          '',
          '支持的算法:',
          '  md5, sha1, sha256, sha512',
          '',
          '示例:',
          '  hashgen sha256 password123',
          '  hashgen md5 test',
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
      return { output: '请提供要计算哈希的文本' }
    }
    
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await crypto.subtle.digest(algorithm, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      return {
        output: [
          `🔑 ${algorithm} 哈希`,
          '',
          `原文: ${text}`,
          `哈希: ${hash}`,
          `长度: ${hash.length} 字符`,
        ].join('\n')
      }
    } catch {
      return { output: `无法计算 ${algorithm} 哈希` }
    }
  },
  description: '生成文本哈希值',
  usage: 'hashgen [算法] <文本>',
  examples: ['hashgen sha256 test', 'hashgen md5 hello']
})

registerCommand('jwt-decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const token = args.join(' ')
    
    if (!token) {
      return {
        output: [
          '🔐 JWT解码',
          '',
          '用法: jwt-decode <JWT令牌>',
          '',
          '示例:',
          '  jwt-decode eyJhbGciOiJIUzI1NiIs...',
        ].join('\n')
      }
    }
    
    try {
      const parts = token.split('.')
      
      if (parts.length !== 3) {
        return { output: '无效的JWT令牌格式' }
      }
      
      const decodeBase64 = (str: string): string => {
        const padded = str.padEnd(str.length + (4 - str.length % 4) % 4, '=')
        return atob(padded)
      }
      
      const header = JSON.parse(decodeBase64(parts[0]))
      const payload = JSON.parse(decodeBase64(parts[1]))
      
      return {
        output: [
          '🔐 JWT令牌解析',
          '',
          '【Header】',
          JSON.stringify(header, null, 2),
          '',
          '【Payload】',
          JSON.stringify(payload, null, 2),
          '',
          '【Signature】',
          parts[2],
          '',
          '提示: 此工具仅解码JWT内容，不验证签名',
        ].join('\n')
      }
    } catch (e) {
      return { output: `JWT解码错误: ${(e as Error).message}` }
    }
  },
  description: '解码JWT令牌',
  usage: 'jwt-decode <令牌>',
  examples: ['jwt-decode eyJhbGciOiJIUzI1NiIs']
})

registerCommand('regex-test', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔍 正则表达式测试',
          '',
          '用法: regex-test <模式> <文本>',
          '',
          '示例:',
          '  regex-test "\\d+" "abc123def"',
          '  regex-test "[a-z]+" "Hello World"',
        ].join('\n')
      }
    }
    
    const pattern = args[0]
    const text = args.slice(1).join(' ')
    
    try {
      const regex = new RegExp(pattern)
      const matches = text.match(regex)
      const allMatches = text.match(new RegExp(pattern, 'g')) || []
      
      const output = [
        '🔍 正则表达式测试',
        '',
        `模式: ${pattern}`,
        `文本: ${text}`,
        '',
        `匹配结果: ${matches ? '✅ 匹配' : '❌ 不匹配'}`,
      ]
      
      if (allMatches.length > 0) {
        output.push('')
        output.push('匹配项:')
        allMatches.forEach((match, index) => {
          output.push(`  ${index + 1}. "${match}"`)
        })
      }
      
      return { output: output.join('\n') }
    } catch (e) {
      return { output: `正则表达式错误: ${(e as Error).message}` }
    }
  },
  description: '测试正则表达式',
  usage: 'regex-test <模式> <文本>',
  examples: ['regex-test "\\d+" "abc123"']
})

registerCommand('url-info', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const url = args.join(' ')
    
    if (!url) {
      return {
        output: [
          '🔗 URL信息解析',
          '',
          '用法: url-info <URL>',
          '',
          '示例:',
          '  url-info https://example.com/path?query=1',
        ].join('\n')
      }
    }
    
    try {
      const parsed = new URL(url)
      
      const output = [
        '🔗 URL信息',
        '',
        `完整URL: ${parsed.href}`,
        `协议: ${parsed.protocol}`,
        `主机: ${parsed.host}`,
        `域名: ${parsed.hostname}`,
        `端口: ${parsed.port || '默认'}`,
        `路径: ${parsed.pathname}`,
        `查询参数: ${parsed.search || '无'}`,
        `片段: ${parsed.hash || '无'}`,
      ]
      
      if (parsed.searchParams.size > 0) {
        output.push('')
        output.push('查询参数详情:')
        parsed.searchParams.forEach((value, key) => {
          output.push(`  ${key}: ${value}`)
        })
      }
      
      return { output: output.join('\n') }
    } catch (e) {
      return { output: `URL解析错误: ${(e as Error).message}` }
    }
  },
  description: '解析URL信息',
  usage: 'url-info <URL>',
  examples: ['url-info https://example.com/path']
})

registerCommand('file-type', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const filename = args[0]
    
    if (!filename) {
      return {
        output: [
          '📁 文件类型检测',
          '',
          '用法: file-type <文件名>',
          '',
          '示例:',
          '  file-type document.pdf',
          '  file-type image.png',
        ].join('\n')
      }
    }
    
    const extension = filename.split('.').pop()?.toLowerCase() || ''
    
    const fileTypes: Record<string, { type: string; mime: string }> = {
      txt: { type: '纯文本文件', mime: 'text/plain' },
      md: { type: 'Markdown文件', mime: 'text/markdown' },
      html: { type: 'HTML文件', mime: 'text/html' },
      css: { type: 'CSS样式文件', mime: 'text/css' },
      js: { type: 'JavaScript文件', mime: 'application/javascript' },
      ts: { type: 'TypeScript文件', mime: 'application/typescript' },
      json: { type: 'JSON数据文件', mime: 'application/json' },
      xml: { type: 'XML文件', mime: 'application/xml' },
      yaml: { type: 'YAML配置文件', mime: 'text/yaml' },
      yml: { type: 'YAML配置文件', mime: 'text/yaml' },
      pdf: { type: 'PDF文档', mime: 'application/pdf' },
      doc: { type: 'Word文档', mime: 'application/msword' },
      docx: { type: 'Word文档(新版)', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      xls: { type: 'Excel表格', mime: 'application/vnd.ms-excel' },
      xlsx: { type: 'Excel表格(新版)', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      ppt: { type: 'PowerPoint演示', mime: 'application/vnd.ms-powerpoint' },
      pptx: { type: 'PowerPoint演示(新版)', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
      jpg: { type: 'JPEG图片', mime: 'image/jpeg' },
      jpeg: { type: 'JPEG图片', mime: 'image/jpeg' },
      png: { type: 'PNG图片', mime: 'image/png' },
      gif: { type: 'GIF动画', mime: 'image/gif' },
      svg: { type: 'SVG矢量图', mime: 'image/svg+xml' },
      webp: { type: 'WebP图片', mime: 'image/webp' },
      mp4: { type: 'MP4视频', mime: 'video/mp4' },
      webm: { type: 'WebM视频', mime: 'video/webm' },
      mp3: { type: 'MP3音频', mime: 'audio/mpeg' },
      wav: { type: 'WAV音频', mime: 'audio/wav' },
      zip: { type: 'ZIP压缩包', mime: 'application/zip' },
      tar: { type: 'TAR归档', mime: 'application/x-tar' },
      gz: { type: 'GZIP压缩', mime: 'application/gzip' },
      '7z': { type: '7-Zip压缩', mime: 'application/x-7z-compressed' },
      sh: { type: 'Shell脚本', mime: 'application/x-shellscript' },
      py: { type: 'Python脚本', mime: 'text/x-python' },
      go: { type: 'Go源代码', mime: 'text/x-go' },
      rs: { type: 'Rust源代码', mime: 'text/x-rust' },
      java: { type: 'Java源代码', mime: 'text/x-java' },
      cpp: { type: 'C++源代码', mime: 'text/x-c++src' },
      c: { type: 'C源代码', mime: 'text/x-csrc' },
      php: { type: 'PHP脚本', mime: 'application/x-httpd-php' },
    }
    
    const info = fileTypes[extension]
    
    if (info) {
      return {
        output: [
          '📁 文件类型检测',
          '',
          `文件名: ${filename}`,
          `扩展名: .${extension}`,
          `文件类型: ${info.type}`,
          `MIME类型: ${info.mime}`,
        ].join('\n')
      }
    }
    
    return {
      output: [
        '📁 文件类型检测',
        '',
        `文件名: ${filename}`,
        `扩展名: .${extension}`,
        `文件类型: 未知类型`,
        `MIME类型: application/octet-stream`,
      ].join('\n')
    }
  },
  description: '检测文件类型',
  usage: 'file-type <文件名>',
  examples: ['file-type document.pdf', 'file-type image.png']
})

registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const now = Date.now()
      const date = new Date()
      
      return {
        output: [
          '⏱️ 当前时间戳',
          '',
          `Unix时间戳: ${now}`,
          `日期时间: ${date.toLocaleString('zh-CN')}`,
          `ISO格式: ${date.toISOString()}`,
        ].join('\n')
      }
    }
    
    const timestamp = parseInt(args[0])
    
    if (isNaN(timestamp)) {
      return { output: '错误: 无效的时间戳' }
    }
    
    const date = new Date(timestamp * 1000)
    
    return {
      output: [
        '⏱️ 时间戳转换',
        '',
        `Unix时间戳: ${timestamp}`,
        `日期时间: ${date.toLocaleString('zh-CN')}`,
        `ISO格式: ${date.toISOString()}`,
      ].join('\n')
    }
  },
  description: '显示或转换Unix时间戳',
  usage: 'timestamp [时间戳]',
  examples: ['timestamp', 'timestamp 1672531200']
})

registerCommand('base-convert', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 3) {
      return {
        output: [
          '🔢 进制转换器',
          '',
          '用法: base-convert <数值> <源进制> <目标进制>',
          '',
          '支持进制: 2-36',
          '',
          '示例:',
          '  base-convert 10 10 2',
          '  base-convert FF 16 10',
          '  base-convert 1010 2 16',
        ].join('\n')
      }
    }
    
    const value = args[0]
    const fromBase = parseInt(args[1])
    const toBase = parseInt(args[2])
    
    if (isNaN(fromBase) || isNaN(toBase) || fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
      return { output: '错误: 进制必须在2-36之间' }
    }
    
    try {
      const decimal = parseInt(value, fromBase)
      const result = decimal.toString(toBase).toUpperCase()
      
      return {
        output: [
          '🔢 进制转换',
          '',
          `${value} (${fromBase}进制) = ${result} (${toBase}进制)`,
        ].join('\n')
      }
    } catch {
      return { output: '错误: 无效的数值或进制' }
    }
  },
  description: '进制转换器',
  usage: 'base-convert <数值> <源进制> <目标进制>',
  examples: ['base-convert 10 10 2', 'base-convert FF 16 10']
})

registerCommand('url-parse', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const url = args.join(' ')
    
    if (!url) {
      return {
        output: [
          '🔗 URL解析器',
          '',
          '用法: url-parse <URL>',
          '',
          '示例:',
          '  url-parse https://example.com/path?query=1',
        ].join('\n')
      }
    }
    
    try {
      const parsed = new URL(url)
      
      const output = [
        '🔗 URL解析结果',
        '',
        `协议: ${parsed.protocol}`,
        `主机: ${parsed.host}`,
        `域名: ${parsed.hostname}`,
        `端口: ${parsed.port || '默认'}`,
        `路径: ${parsed.pathname}`,
        `查询: ${parsed.search}`,
        `片段: ${parsed.hash}`,
      ]
      
      return { output: output.join('\n') }
    } catch (e) {
      return { output: `URL解析错误: ${(e as Error).message}` }
    }
  },
  description: '解析URL',
  usage: 'url-parse <URL>',
  examples: ['url-parse https://example.com/path']
})

registerCommand('encode-url', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔗 URL编码',
          '',
          '用法: encode-url <文本>',
          '',
          '示例:',
          '  encode-url Hello World!',
        ].join('\n')
      }
    }
    
    return {
      output: [
        '🔗 URL编码结果',
        '',
        `原文: ${text}`,
        `编码: ${encodeURIComponent(text)}`,
      ].join('\n')
    }
  },
  description: 'URL编码',
  usage: 'encode-url <文本>',
  examples: ['encode-url Hello World!']
})

registerCommand('decode-url', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔗 URL解码',
          '',
          '用法: decode-url <编码文本>',
          '',
          '示例:',
          '  decode-url Hello%20World%21',
        ].join('\n')
      }
    }
    
    try {
      return {
        output: [
          '🔗 URL解码结果',
          '',
          `编码: ${text}`,
          `原文: ${decodeURIComponent(text)}`,
        ].join('\n')
      }
    } catch {
      return { output: 'URL解码错误' }
    }
  },
  description: 'URL解码',
  usage: 'decode-url <文本>',
  examples: ['decode-url Hello%20World%21']
})

registerCommand('json-pretty', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const jsonStr = args.join(' ')
    
    if (!jsonStr) {
      return {
        output: [
          '📋 JSON格式化',
          '',
          '用法: json-pretty <JSON字符串>',
          '',
          '示例:',
          '  json-pretty {"name":"test","value":1}',
        ].join('\n')
      }
    }
    
    try {
      const parsed = JSON.parse(jsonStr)
      return { output: JSON.stringify(parsed, null, 2) }
    } catch (e) {
      return { output: `JSON解析错误: ${(e as Error).message}` }
    }
  },
  description: '格式化JSON',
  usage: 'json-pretty <JSON>',
  examples: ['json-pretty {"name":"test"}']
})

registerCommand('csv-format', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '📊 CSV格式化',
          '',
          '用法: csv-format <CSV文本>',
          '',
          '示例:',
          '  csv-format name,value\\ntest,1',
        ].join('\n')
      }
    }
    
    const lines = text.split('\\n')
    const headers = lines[0].split(',')
    const maxWidths = headers.map(h => h.length)
    
    lines.slice(1).forEach(line => {
      line.split(',').forEach((cell, i) => {
        maxWidths[i] = Math.max(maxWidths[i], cell.length)
      })
    })
    
    const formatLine = (line: string) => {
      return '| ' + line.split(',').map((cell, i) => cell.padEnd(maxWidths[i])).join(' | ') + ' |'
    }
    
    const output = [
      formatLine(lines[0]),
      '|-' + maxWidths.map(w => '-'.repeat(w + 2)).join('-') + '-|',
      ...lines.slice(1).map(formatLine)
    ]
    
    return { output: output.join('\n') }
  },
  description: '格式化CSV表格',
  usage: 'csv-format <CSV>',
  examples: ['csv-format name,value\\ntest,1']
})

registerCommand('ascii-table', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📋 ASCII表格生成器',
          '',
          '用法: ascii-table <标题> <内容行...>',
          '',
          '示例:',
          '  ascii-table "Name,Age" "John,30" "Jane,25"',
        ].join('\n')
      }
    }
    
    const headers = args[0].split(',')
    const rows = args.slice(1).map(row => row.split(','))
    
    const maxWidths = headers.map((h, i) => {
      const rowMax = Math.max(...rows.map(row => row[i]?.length || 0))
      return Math.max(h.length, rowMax) + 2
    })
    
    const separator = '+' + maxWidths.map(w => '-'.repeat(w)).join('+') + '+'
    
    const output = [
      separator,
      '| ' + headers.map((h, i) => h.padEnd(maxWidths[i] - 2)).join(' | ') + ' |',
      separator,
      ...rows.map(row => '| ' + row.map((cell, i) => (cell || '').padEnd(maxWidths[i] - 2)).join(' | ') + ' |'),
      separator,
    ]
    
    return { output: output.join('\n') }
  },
  description: '生成ASCII表格',
  usage: 'ascii-table <标题> <行...>',
  examples: ['ascii-table "Name,Age" "John,30"']
})

registerCommand('progress', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📊 进度条',
          '',
          '用法: progress <百分比>',
          '',
          '示例:',
          '  progress 50',
          '  progress 75',
        ].join('\n')
      }
    }
    
    const percent = parseInt(args[0])
    
    if (isNaN(percent) || percent < 0 || percent > 100) {
      return { output: '错误: 百分比必须在0-100之间' }
    }
    
    const barLength = 50
    const filled = Math.round((percent / 100) * barLength)
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled)
    
    return {
      output: [
        '📊 进度',
        '',
        `[${bar}] ${percent}%`,
      ].join('\n')
    }
  },
  description: '显示进度条',
  usage: 'progress <百分比>',
  examples: ['progress 50', 'progress 75']
})

registerCommand('color-hex', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const hex = args[0]?.toUpperCase() || '#8B7CF0'
    
    const hexToRgb = (hexStr: string): { r: number; g: number; b: number } | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexStr)
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null
    }
    
    const rgb = hexToRgb(hex)
    
    if (!rgb) {
      return {
        output: [
          '🎨 颜色工具',
          '',
          '用法: color-hex <hex颜色值>',
          '',
          '示例:',
          '  color-hex #8B7CF0',
          '  color-hex #FF5733',
        ].join('\n')
      }
    }
    
    const { r, g, b } = rgb
    const hsl = rgbToHsl(r, g, b)
    
    return {
      output: [
        '🎨 颜色信息',
        '',
        `HEX: ${hex}`,
        `RGB: rgb(${r}, ${g}, ${b})`,
        `HSL: hsl(${hsl.h.toFixed(0)}, ${hsl.s.toFixed(0)}%, ${hsl.l.toFixed(0)}%)`,
        `亮度: ${(0.299 * r + 0.587 * g + 0.114 * b > 128 ? '浅色' : '深色')}`,
      ].join('\n')
    }
  },
  description: '颜色信息查询',
  usage: 'color-hex <hex>',
  examples: ['color-hex #8B7CF0']
})

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 }
}

registerCommand('http-status', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const statusCode = parseInt(args[0])
    
    if (isNaN(statusCode)) {
      return {
        output: [
          '🌐 HTTP状态码查询',
          '',
          '用法: http-status <状态码>',
          '',
          '示例:',
          '  http-status 404',
          '  http-status 500',
          '',
          '常用状态码:',
          '  1xx - 信息性响应',
          '  2xx - 成功响应',
          '  3xx - 重定向',
          '  4xx - 客户端错误',
          '  5xx - 服务器错误',
        ].join('\n')
      }
    }
    
    const statusCodes: Record<number, { message: string; description: string }> = {
      100: { message: 'Continue', description: '服务器已收到请求的一部分，等待剩余部分' },
      101: { message: 'Switching Protocols', description: '服务器将切换协议' },
      200: { message: 'OK', description: '请求成功' },
      201: { message: 'Created', description: '请求成功且服务器创建了新的资源' },
      202: { message: 'Accepted', description: '服务器已接受请求，但尚未处理完成' },
      204: { message: 'No Content', description: '服务器成功处理了请求，但没有返回任何内容' },
      301: { message: 'Moved Permanently', description: '请求的资源已永久移动到新位置' },
      302: { message: 'Found', description: '请求的资源临时移动到新位置' },
      304: { message: 'Not Modified', description: '资源未修改，使用缓存版本' },
      400: { message: 'Bad Request', description: '服务器无法理解请求' },
      401: { message: 'Unauthorized', description: '请求需要身份验证' },
      403: { message: 'Forbidden', description: '服务器拒绝请求' },
      404: { message: 'Not Found', description: '请求的资源未找到' },
      405: { message: 'Method Not Allowed', description: '请求方法不被允许' },
      408: { message: 'Request Timeout', description: '请求超时' },
      409: { message: 'Conflict', description: '请求与服务器状态冲突' },
      500: { message: 'Internal Server Error', description: '服务器内部错误' },
      501: { message: 'Not Implemented', description: '服务器不支持请求的功能' },
      502: { message: 'Bad Gateway', description: '网关错误' },
      503: { message: 'Service Unavailable', description: '服务器暂时无法处理请求' },
      504: { message: 'Gateway Timeout', description: '网关超时' },
    }
    
    const info = statusCodes[statusCode]
    
    if (info) {
      return {
        output: [
          '🌐 HTTP状态码',
          '',
          `${statusCode} ${info.message}`,
          '',
          info.description,
        ].join('\n')
      }
    }
    
    const category = Math.floor(statusCode / 100)
    const categories: Record<number, string> = {
      1: '信息性响应',
      2: '成功响应',
      3: '重定向',
      4: '客户端错误',
      5: '服务器错误',
    }
    
    return {
      output: [
        '🌐 HTTP状态码',
        '',
        `${statusCode} - ${categories[category] || '未知类别'}`,
        '',
        '详细描述: 未找到该状态码的详细信息',
      ].join('\n')
    }
  },
  description: '查询HTTP状态码',
  usage: 'http-status <状态码>',
  examples: ['http-status 404', 'http-status 500']
})

registerCommand('leetcode', {
  handler: (): CommandResult => {
    const problems = [
      { id: 1, title: '两数之和', difficulty: '简单', tags: ['数组', '哈希表'] },
      { id: 2, title: '两数相加', difficulty: '中等', tags: ['链表', '数学'] },
      { id: 3, title: '无重复字符的最长子串', difficulty: '中等', tags: ['字符串', '滑动窗口'] },
      { id: 4, title: '寻找两个正序数组的中位数', difficulty: '困难', tags: ['数组', '二分查找'] },
      { id: 5, title: '最长回文子串', difficulty: '中等', tags: ['字符串', '动态规划'] },
      { id: 15, title: '三数之和', difficulty: '中等', tags: ['数组', '双指针'] },
      { id: 20, title: '有效的括号', difficulty: '简单', tags: ['栈', '字符串'] },
      { id: 21, title: '合并两个有序链表', difficulty: '简单', tags: ['链表', '递归'] },
      { id: 42, title: '接雨水', difficulty: '困难', tags: ['栈', '数组', '双指针'] },
      { id: 53, title: '最大子数组和', difficulty: '中等', tags: ['数组', '动态规划'] },
    ]
    
    const randomProblem = problems[Math.floor(Math.random() * problems.length)]
    
    return {
      output: [
        '📚 LeetCode 每日一题',
        '',
        `编号: #${randomProblem.id}`,
        `标题: ${randomProblem.title}`,
        `难度: ${randomProblem.difficulty}`,
        `标签: ${randomProblem.tags.join(', ')}`,
        '',
        '访问: https://leetcode.cn/problems/two-sum/',
      ].join('\n')
    }
  },
  description: '获取LeetCode每日一题',
  usage: 'leetcode',
  examples: ['leetcode']
})

registerCommand('code-highlight', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🎨 代码高亮',
          '',
          '用法: code-highlight <语言> <代码>',
          '',
          '支持语言: js, ts, python, html, css, json',
          '',
          '示例:',
          '  code-highlight js console.log("Hello");',
        ].join('\n')
      }
    }
    
    const language = args[0].toLowerCase()
    const code = args.slice(1).join(' ')
    
    const keywords: Record<string, string[]> = {
      js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await', 'new', 'this', 'try', 'catch', 'throw'],
      ts: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await', 'new', 'this', 'try', 'catch', 'throw', 'interface', 'type', 'enum', 'extends', 'implements', 'private', 'public', 'protected'],
      python: ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'class', 'import', 'from', 'as', 'try', 'except', 'raise', 'with', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None'],
      html: ['<!DOCTYPE', '<html>', '<head>', '<body>', '<div>', '<span>', '<p>', '<h1>', '<h2>', '<h3>', '<a>', '<img>', '<ul>', '<li>', '<table>', '<tr>', '<td>', '<input>', '<button>', '<script>', '</html>', '</head>', '</body>'],
      css: ['body', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'a', 'img', 'ul', 'li', 'table', 'tr', 'td', 'input', 'button', 'font-size', 'color', 'background', 'margin', 'padding', 'border', 'display', 'position', 'width', 'height'],
      json: ['true', 'false', 'null'],
    }
    
    const langKeywords = keywords[language] || []
    
    let highlighted = code
    
    langKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
      highlighted = highlighted.replace(regex, `\x1b[34m$1\x1b[0m`)
    })
    
    highlighted = highlighted.replace(/("[^"]*"|'[^']*')/g, '\x1b[32m$1\x1b[0m')
    highlighted = highlighted.replace(/(\d+)/g, '\x1b[31m$1\x1b[0m')
    highlighted = highlighted.replace(/(\/\/.*|#.*)/g, '\x1b[90m$1\x1b[0m')
    
    return {
      output: [
        `🎨 ${language.toUpperCase()} 代码高亮`,
        '',
        highlighted,
      ].join('\n')
    }
  },
  description: '代码语法高亮',
  usage: 'code-highlight <语言> <代码>',
  examples: ['code-highlight js console.log("Hello");']
})

registerCommand('cron-parse', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const expression = args.join(' ')
    
    if (!expression) {
      return {
        output: [
          '⏰ Cron表达式解析',
          '',
          '用法: cron-parse <表达式>',
          '',
          '格式: 分 时 日 月 周',
          '',
          '示例:',
          '  cron-parse "0 9 * * 1-5"',
          '  cron-parse "*/30 * * * *"',
        ].join('\n')
      }
    }
    
    const parts = expression.trim().split(/\s+/)
    
    if (parts.length !== 5) {
      return { output: '错误: Cron表达式必须包含5个字段' }
    }
    
    const [minute, hour, day, month, weekday] = parts
    
    const output = [
      '⏰ Cron表达式解析',
      '',
      `原始表达式: ${expression}`,
      '',
      '字段解析:',
      `  分钟: ${parseCronField(minute, '分钟', 0, 59)}`,
      `  小时: ${parseCronField(hour, '小时', 0, 23)}`,
      `  日期: ${parseCronField(day, '日', 1, 31)}`,
      `  月份: ${parseCronField(month, '月', 1, 12)}`,
      `  星期: ${parseCronField(weekday, '周', 0, 7)}`,
      '',
      '说明: 星期 0/7 表示周日',
    ]
    
    return { output: output.join('\n') }
  },
  description: '解析Cron表达式',
  usage: 'cron-parse <表达式>',
  examples: ['cron-parse "0 9 * * 1-5"']
})

function parseCronField(field: string, label: string, _min: number, _max: number): string {
  if (field === '*') return `每${label}`
  if (field.startsWith('*/')) {
    const interval = parseInt(field.slice(2))
    return `每${interval}${label}`
  }
  if (field.includes('-')) {
    const [start, end] = field.split('-')
    return `${start}-${end}${label}`
  }
  if (field.includes(',')) {
    return `指定: ${field}${label}`
  }
  return `${field}${label}`
}

registerCommand('ascii-art', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ') || 'ART'
    
    const artChars: Record<string, string[]> = {
      'A': ['  ██████  ', ' ██    ██ ', ' ████████ ', ' ██    ██ ', ' ██    ██ '],
      'B': [' ██████   ', ' ██   ██  ', ' ██████   ', ' ██   ██  ', ' ██████   '],
      'C': ['  ██████  ', ' ██       ', ' ██       ', ' ██       ', '  ██████  '],
      'D': [' █████    ', ' ██   ██  ', ' ██   ██  ', ' ██   ██  ', ' █████    '],
      'E': [' ███████  ', ' ██       ', ' ██████   ', ' ██       ', ' ███████  '],
      'F': [' ███████  ', ' ██       ', ' ██████   ', ' ██       ', ' ██       '],
      'G': ['  ██████  ', ' ██       ', ' ██   ██  ', ' ██   ██  ', '  ██████  '],
      'H': [' ██   ██  ', ' ██   ██  ', ' ████████ ', ' ██   ██  ', ' ██   ██  '],
      'I': ['  ██████  ', '    ██    ', '    ██    ', '    ██    ', '  ██████  '],
      'J': [' ████████ ', '       ██ ', '       ██ ', '  ██   ██ ', '   █████  '],
      'K': [' ██   ██  ', ' ██  ██   ', ' █████    ', ' ██  ██   ', ' ██   ██  '],
      'L': [' ██       ', ' ██       ', ' ██       ', ' ██       ', ' ████████ '],
      'M': [' ██   ██  ', ' ███ ███  ', ' ██ █ ██  ', ' ██   ██  ', ' ██   ██  '],
      'N': [' ██   ██  ', ' ███  ██  ', ' ██ █ ██  ', ' ██  ███  ', ' ██   ██  '],
      'O': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
      'P': [' ██████   ', ' ██   ██  ', ' ██████   ', ' ██       ', ' ██       '],
      'Q': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██  ████ ', '  ██████  '],
      'R': [' ██████   ', ' ██   ██  ', ' ██████   ', ' ██  ██   ', ' ██   ██  '],
      'S': ['  ██████  ', ' ██       ', '  ██████  ', '       ██ ', '  ██████  '],
      'T': [' ████████ ', '    ██    ', '    ██    ', '    ██    ', '    ██    '],
      'U': [' ██   ██  ', ' ██   ██  ', ' ██   ██  ', ' ██   ██  ', '  ██████  '],
      'V': [' ██   ██  ', ' ██   ██  ', ' ██   ██  ', '  ██ ██   ', '   ███    '],
      'W': [' ██   ██  ', ' ██   ██  ', ' ██ █ ██  ', ' ███ ███  ', ' ██   ██  '],
      'X': [' ██   ██  ', '  ██ ██   ', '   ███    ', '  ██ ██   ', ' ██   ██  '],
      'Y': [' ██   ██  ', '  ██ ██   ', '   ███    ', '    ██    ', '    ██    '],
      'Z': [' ████████ ', '       ██ ', '      ██  ', '     ██   ', ' ████████ '],
      '0': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
      '1': ['    ██    ', '   ███    ', '    ██    ', '    ██    ', '    ██    '],
      '2': ['  ██████  ', ' ██    ██ ', '       ██ ', '     ██   ', ' ████████ '],
      '3': ['  ██████  ', ' ██    ██ ', '       ██ ', ' ██    ██ ', '  ██████  '],
      '4': ['       ██ ', '    ██ ██ ', '  ██  ██  ', ' ████████ ', '     ██   '],
      '5': [' ████████ ', ' ██       ', ' ████████ ', '       ██ ', ' ████████ '],
      '6': ['       ██ ', '      ██  ', '     ██   ', ' ██    ██ ', '  ██████  '],
      '7': [' ████████ ', '       ██ ', '      ██  ', '     ██   ', '    ██    '],
      '8': ['  ██████  ', ' ██    ██ ', '  ██████  ', ' ██    ██ ', '  ██████  '],
      '9': ['  ██████  ', ' ██    ██ ', '  ███████ ', '       ██ ', '  ██████  '],
      ' ': ['          ', '          ', '          ', '          ', '          '],
    }
    
    const uppercaseText = text.toUpperCase().slice(0, 10)
    const lines: string[] = []
    
    for (let i = 0; i < 5; i++) {
      let line = ''
      for (const char of uppercaseText) {
        const art = artChars[char] || artChars[' ']
        line += art[i] + ' '
      }
      lines.push(line)
    }
    
    return {
      output: [
        '🎨 ASCII艺术字',
        '',
        ...lines,
      ].join('\n')
    }
  },
  description: '生成ASCII艺术字',
  usage: 'ascii-art <文本>',
  examples: ['ascii-art HELLO', 'ascii-art TEST']
})