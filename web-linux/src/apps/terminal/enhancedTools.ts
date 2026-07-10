import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { formatBytes } from '../../utils/apiCache'
import { findNodeByPath, resolvePath } from '../../store'

registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const now = Date.now()
      return {
        output: [
          '⏰ 时间戳工具',
          '',
          `当前时间戳(毫秒): ${now}`,
          `当前时间戳(秒): ${Math.floor(now / 1000)}`,
          `当前时间: ${new Date(now).toLocaleString('zh-CN')}`,
          '',
          '用法: timestamp <时间戳> 转换时间戳',
          '示例: timestamp 1672531200000',
        ].join('\n')
      }
    }
    
    const ts = parseInt(args[0])
    if (isNaN(ts)) {
      return { output: 'timestamp: 无效的时间戳' }
    }
    
    const date = new Date(ts.toString().length > 12 ? ts : ts * 1000)
    
    return {
      output: [
        '⏰ 时间戳转换',
        '',
        `时间戳: ${ts}`,
        `转换结果: ${date.toLocaleString('zh-CN')}`,
        `ISO格式: ${date.toISOString()}`,
        `星期: ${['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}`,
      ].join('\n')
    }
  },
  description: '时间戳转换工具',
  usage: 'timestamp [时间戳]',
  examples: ['timestamp', 'timestamp 1672531200000']
})

registerCommand('uuidv4', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = parseInt(args[0]) || 1
    
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
    
    const output: string[] = ['📋 UUID 生成']
    output.push('')
    
    for (let i = 0; i < count; i++) {
      output.push(generateUUID())
    }
    
    if (count > 1) {
      output.push('')
      output.push(`共生成 ${count} 个UUID`)
    }
    
    return { output: output.join('\n') }
  },
  description: '生成UUID v4',
  usage: 'uuidv4 [数量]',
  examples: ['uuidv4', 'uuidv4 5']
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
          '  password-strength MyPassword123',
          '  password-strength secure@Pass1',
        ].join('\n')
      }
    }
    
    let score = 0
    const feedback: string[] = []
    
    if (password.length >= 8) score += 1
    else feedback.push('密码长度应至少8位')
    
    if (password.length >= 12) score += 1
    
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('应包含小写字母')
    
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('应包含大写字母')
    
    if (/[0-9]/.test(password)) score += 1
    else feedback.push('应包含数字')
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    else feedback.push('应包含特殊字符')
    
    if (!/(\w)\1{2,}/.test(password)) score += 1
    else feedback.push('避免连续重复字符')
    
    let strength = '弱'
    let color = '\x1b[31m'
    
    if (score >= 6) { strength = '强'; color = '\x1b[32m' }
    else if (score >= 4) { strength = '中等'; color = '\x1b[33m' }
    
    const output: string[] = [
      '🔐 密码强度检测',
      '',
      `密码长度: ${password.length} 位`,
      `检测分数: ${score}/7`,
      `强度等级: ${color}${strength}\x1b[0m`,
    ]
    
    if (feedback.length > 0) {
      output.push('')
      output.push('改进建议:')
      feedback.forEach(f => output.push(`  • ${f}`))
    }
    
    return { output: output.join('\n') }
  },
  description: '检测密码强度',
  usage: 'password-strength <密码>',
  examples: ['password-strength MyPassword123']
})

registerCommand('json-pretty', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📋 JSON 美化工具',
          '',
          '用法: json-pretty <JSON字符串>',
          '',
          '功能:',
          '  - 格式化JSON输出',
          '  - 验证JSON格式',
          '  - 压缩JSON字符串',
          '',
          '示例:',
          '  json-pretty {"name":"test","value":123}',
          '  json-pretty --compact {"a":1,"b":2}',
        ].join('\n')
      }
    }
    
    const compact = args[0] === '--compact'
    const jsonStr = compact ? args.slice(1).join(' ') : args.join(' ')
    
    try {
      const parsed = JSON.parse(jsonStr)
      
      if (compact) {
        return { output: JSON.stringify(parsed) }
      }
      
      return { output: JSON.stringify(parsed, null, 2) }
    } catch (e) {
      return { output: `json-pretty: JSON解析错误 - ${(e as Error).message}` }
    }
  },
  description: 'JSON美化和压缩',
  usage: 'json-pretty [--compact] <JSON>',
  examples: ['json-pretty {"a":1}', 'json-pretty --compact {"a":1}']
})

registerCommand('regex-test', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔍 正则表达式测试',
          '',
          '用法: regex-test <模式> <文本> [标志]',
          '',
          '标志:',
          '  g - 全局匹配',
          '  i - 忽略大小写',
          '  m - 多行模式',
          '',
          '示例:',
          '  regex-test "hello" "Hello World" i',
          '  regex-test "\\d+" "abc123def456"',
          '  regex-test "^a" "apple\\nbanana" m',
        ].join('\n')
      }
    }
    
    const pattern = args[0]
    const text = args[1]
    const flags = args[2] || ''
    
    try {
      const regex = new RegExp(pattern, flags)
      const matches = text.match(regex)
      
      const output: string[] = [
        '🔍 正则测试结果',
        '',
        `模式: ${pattern}`,
        `文本: ${text}`,
        `标志: ${flags || '无'}`,
        '',
      ]
      
      if (matches) {
        output.push(`匹配成功!`)
        output.push(`找到 ${matches.length} 个匹配:`)
        matches.forEach((m, i) => output.push(`  ${i + 1}. ${m}`))
        
        const execResults: string[] = []
        let match
        const execRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
        while ((match = execRegex.exec(text)) !== null) {
          execResults.push(`位置 ${match.index}: "${match[0]}"`)
        }
        output.push('')
        output.push('匹配详情:')
        execResults.forEach(r => output.push(`  ${r}`))
      } else {
        output.push('匹配失败!')
        output.push('没有找到匹配的内容')
      }
      
      return { output: output.join('\n') }
    } catch (e) {
      return { output: `regex-test: 正则语法错误 - ${(e as Error).message}` }
    }
  },
  description: '正则表达式测试工具',
  usage: 'regex-test <模式> <文本> [标志]',
  examples: ['regex-test "hello" "Hello World" i', 'regex-test "\\d+" "abc123"']
})

registerCommand('base64-url', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔐 URL安全Base64编码',
          '',
          '用法: base64-url <文本>',
          '',
          '特点: 使用URL安全字符集(-_代替+/)',
          '',
          '示例:',
          '  base64-url Hello World!',
        ].join('\n')
      }
    }
    
    const encoded = btoa(text)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    return { output: encoded }
  },
  description: 'URL安全Base64编码',
  usage: 'base64-url <文本>',
  examples: ['base64-url Hello World!']
})

registerCommand('cron-parse', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const cron = args.join(' ')
    
    if (!cron) {
      return {
        output: [
          '⏰ Cron表达式解析器',
          '',
          '用法: cron-parse <cron表达式>',
          '',
          'Cron格式: 分 时 日 月 周',
          '',
          '示例:',
          '  cron-parse "0 9 * * 1-5"',
          '  cron-parse "*/5 * * * *"',
          '  cron-parse "0 0 1 * *"',
        ].join('\n')
      }
    }
    
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) {
      return { output: 'cron-parse: 无效的Cron表达式格式' }
    }
    
    const [minute, hour, day, month, weekday] = parts
    
    const parseField = (field: string, type: string): string => {
      const mappings: Record<string, Record<string, string>> = {
        weekday: { '0': '周日', '1': '周一', '2': '周二', '3': '周三', '4': '周四', '5': '周五', '6': '周六' },
        month: { '1': '一月', '2': '二月', '3': '三月', '4': '四月', '5': '五月', '6': '六月', '7': '七月', '8': '八月', '9': '九月', '10': '十月', '11': '十一月', '12': '十二月' },
      }
      
      if (field === '*') return '每' + type
      if (field.startsWith('*/')) return `每${field.slice(2)}${type}`
      if (field.includes('-')) {
        const [start, end] = field.split('-')
        const sm = mappings[type] || {}
        return `${sm[start] || start}到${sm[end] || end}的${type}`
      }
      if (field.includes(',')) {
        const items = field.split(',')
        const sm = mappings[type] || {}
        return items.map(i => sm[i] || i).join('、') + '的' + type
      }
      
      const sm = mappings[type] || {}
      return sm[field] || field + type
    }
    
    const output: string[] = [
      '⏰ Cron表达式解析',
      '',
      `表达式: ${cron}`,
      '',
      '解析结果:',
      `  分钟: ${parseField(minute, '分钟')}`,
      `  小时: ${parseField(hour, '小时')}`,
      `  日期: ${parseField(day, '日')}`,
      `  月份: ${parseField(month, '月')}`,
      `  星期: ${parseField(weekday, '周')}`,
    ]
    
    return { output: output.join('\n') }
  },
  description: 'Cron表达式解析器',
  usage: 'cron-parse <表达式>',
  examples: ['cron-parse "0 9 * * 1-5"', 'cron-parse "*/5 * * * *"']
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
          '  url-info http://api.example.com/v2/users',
        ].join('\n')
      }
    }
    
    try {
      const parsed = new URL(url)
      
      const output: string[] = [
        '🔗 URL解析结果',
        '',
        `完整URL: ${parsed.href}`,
        `协议: ${parsed.protocol}`,
        `主机: ${parsed.host}`,
        `域名: ${parsed.hostname}`,
        `端口: ${parsed.port || '默认'}`,
        `路径: ${parsed.pathname}`,
        `查询: ${parsed.search || '无'}`,
        `哈希: ${parsed.hash || '无'}`,
      ]
      
      if (parsed.searchParams.size > 0) {
        output.push('')
        output.push('查询参数:')
        parsed.searchParams.forEach((value, key) => {
          output.push(`  ${key}: ${value}`)
        })
      }
      
      return { output: output.join('\n') }
    } catch (e) {
      return { output: `url-info: 无效的URL格式 - ${(e as Error).message}` }
    }
  },
  description: 'URL信息解析',
  usage: 'url-info <URL>',
  examples: ['url-info https://example.com/path?query=1']
})

registerCommand('env', {
  handler: (): CommandResult => {
    const output: string[] = [
      '🌐 环境变量',
      '',
      '┌──────────────────────────────────────────────────────────────┐',
      '│ WebLinuxOS 环境配置                                          │',
      '└──────────────────────────────────────────────────────────────┘',
      '',
    ]
    
    const envVars: Record<string, string> = {
      'USER': 'user',
      'HOSTNAME': 'web-linux',
      'HOME': '/home/user',
      'SHELL': '/bin/bash',
      'PATH': '/usr/local/bin:/usr/bin:/bin',
      'PWD': '/home/user',
      'LANG': 'zh_CN.UTF-8',
      'TERM': 'xterm-256color',
      'EDITOR': 'nano',
      'TZ': 'Asia/Shanghai',
      'VERSION': '2.9.0',
    }
    
    Object.entries(envVars).forEach(([key, value]) => {
      output.push(`${key}=${value}`)
    })
    
    return { output: output.join('\n') }
  },
  description: '显示环境变量',
  usage: 'env',
  examples: ['env']
})

registerCommand('file-type', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📄 文件类型检测',
          '',
          '用法: file-type <文件>',
          '',
          '示例:',
          '  file-type document.pdf',
          '  file-type image.png',
          '  file-type script.py',
        ].join('\n')
      }
    }
    
    const filePath = args[0]
    const resolved = resolvePath(cwd, filePath)
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `file-type: ${filePath}: 没有那个文件或目录` }
    }
    
    const name = node.name.toLowerCase()
    const ext = name.split('.').pop() || ''
    
    const typeMap: Record<string, { type: string; category: string; desc: string }> = {
      'txt': { type: 'text/plain', category: '文本文件', desc: '纯文本文件' },
      'md': { type: 'text/markdown', category: 'Markdown', desc: 'Markdown文档' },
      'json': { type: 'application/json', category: 'JSON', desc: 'JSON数据文件' },
      'js': { type: 'application/javascript', category: 'JavaScript', desc: 'JavaScript代码' },
      'ts': { type: 'application/typescript', category: 'TypeScript', desc: 'TypeScript代码' },
      'tsx': { type: 'application/tsx', category: 'React TSX', desc: 'React TypeScript组件' },
      'jsx': { type: 'application/jsx', category: 'React JSX', desc: 'React JavaScript组件' },
      'html': { type: 'text/html', category: 'HTML', desc: 'HTML网页' },
      'css': { type: 'text/css', category: 'CSS', desc: '样式表' },
      'py': { type: 'text/python', category: 'Python', desc: 'Python脚本' },
      'java': { type: 'text/java', category: 'Java', desc: 'Java源代码' },
      'go': { type: 'text/go', category: 'Go', desc: 'Go源代码' },
      'rs': { type: 'text/rust', category: 'Rust', desc: 'Rust源代码' },
      'cpp': { type: 'text/cpp', category: 'C++', desc: 'C++源代码' },
      'c': { type: 'text/c', category: 'C', desc: 'C源代码' },
      'php': { type: 'text/php', category: 'PHP', desc: 'PHP脚本' },
      'sh': { type: 'text/bash', category: 'Shell', desc: 'Shell脚本' },
      'sql': { type: 'text/sql', category: 'SQL', desc: 'SQL查询' },
      'xml': { type: 'application/xml', category: 'XML', desc: 'XML文档' },
      'yml': { type: 'application/yaml', category: 'YAML', desc: 'YAML配置' },
      'yaml': { type: 'application/yaml', category: 'YAML', desc: 'YAML配置' },
      'pdf': { type: 'application/pdf', category: 'PDF', desc: 'PDF文档' },
      'doc': { type: 'application/msword', category: 'Word', desc: 'Word文档' },
      'docx': { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'Word', desc: 'Word文档' },
      'xls': { type: 'application/vnd.ms-excel', category: 'Excel', desc: 'Excel表格' },
      'xlsx': { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'Excel', desc: 'Excel表格' },
      'ppt': { type: 'application/vnd.ms-powerpoint', category: 'PowerPoint', desc: '演示文稿' },
      'pptx': { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'PowerPoint', desc: '演示文稿' },
      'png': { type: 'image/png', category: '图片', desc: 'PNG图像' },
      'jpg': { type: 'image/jpeg', category: '图片', desc: 'JPEG图像' },
      'jpeg': { type: 'image/jpeg', category: '图片', desc: 'JPEG图像' },
      'gif': { type: 'image/gif', category: '图片', desc: 'GIF动画' },
      'svg': { type: 'image/svg+xml', category: '图片', desc: 'SVG矢量图' },
      'webp': { type: 'image/webp', category: '图片', desc: 'WebP图像' },
      'bmp': { type: 'image/bmp', category: '图片', desc: 'BMP图像' },
      'mp3': { type: 'audio/mpeg', category: '音频', desc: 'MP3音频' },
      'wav': { type: 'audio/wav', category: '音频', desc: 'WAV音频' },
      'flac': { type: 'audio/flac', category: '音频', desc: 'FLAC无损音频' },
      'mp4': { type: 'video/mp4', category: '视频', desc: 'MP4视频' },
      'webm': { type: 'video/webm', category: '视频', desc: 'WebM视频' },
      'zip': { type: 'application/zip', category: '压缩', desc: 'ZIP压缩包' },
      'tar': { type: 'application/x-tar', category: '压缩', desc: 'TAR归档' },
      'gz': { type: 'application/gzip', category: '压缩', desc: 'GZIP压缩' },
      'rar': { type: 'application/x-rar-compressed', category: '压缩', desc: 'RAR压缩包' },
    }
    
    const fileInfo = typeMap[ext] || { type: 'application/octet-stream', category: '未知', desc: '未知文件类型' }
    
    const content = node.content || ''
    const size = content.length
    
    const output: string[] = [
      '📄 文件类型信息',
      '',
      `文件名: ${node.name}`,
      `扩展名: ${ext || '无'}`,
      `类型: ${fileInfo.category}`,
      `MIME: ${fileInfo.type}`,
      `描述: ${fileInfo.desc}`,
      `大小: ${formatBytes(size)}`,
    ]
    
    return { output: output.join('\n') }
  },
  description: '检测文件类型',
  usage: 'file-type <文件>',
  examples: ['file-type document.pdf', 'file-type script.py']
})

registerCommand('json-to-csv', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📊 JSON转CSV',
          '',
          '用法: json-to-csv <JSON数组>',
          '',
          '示例:',
          '  json-to-csv [{"name":"A","value":1},{"name":"B","value":2}]',
        ].join('\n')
      }
    }
    
    try {
      const jsonStr = args.join(' ')
      const data = JSON.parse(jsonStr)
      
      if (!Array.isArray(data)) {
        return { output: 'json-to-csv: 输入必须是JSON数组' }
      }
      
      if (data.length === 0) {
        return { output: 'json-to-csv: 数组为空' }
      }
      
      const headers = Object.keys(data[0])
      const rows = data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
      
      const output = [headers.join(','), ...rows].join('\n')
      
      return { output }
    } catch (e) {
      return { output: `json-to-csv: 解析错误 - ${(e as Error).message}` }
    }
  },
  description: 'JSON数组转CSV',
  usage: 'json-to-csv <JSON数组>',
  examples: ['json-to-csv [{"name":"A","v":1},{"name":"B","v":2}]']
})

registerCommand('csv-to-json', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📊 CSV转JSON',
          '',
          '用法: csv-to-json <CSV文本>',
          '',
          '示例:',
          '  csv-to-json "name,value\\nA,1\\nB,2"',
        ].join('\n')
      }
    }
    
    try {
      const csvStr = args.join(' ')
      const lines = csvStr.split('\n').filter(l => l.trim())
      
      if (lines.length < 2) {
        return { output: 'csv-to-json: CSV内容不足' }
      }
      
      const headers = lines[0].split(',').map(h => h.trim())
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => {
          const trimmed = v.trim().replace(/^"|"$/g, '')
          const num = parseFloat(trimmed)
          return isNaN(num) ? trimmed : num
        })
        const obj: Record<string, unknown> = {}
        headers.forEach((h, i) => { obj[h] = values[i] })
        return obj
      })
      
      return { output: JSON.stringify(data, null, 2) }
    } catch (e) {
      return { output: `csv-to-json: 解析错误 - ${(e as Error).message}` }
    }
  },
  description: 'CSV转JSON数组',
  usage: 'csv-to-json <CSV文本>',
  examples: ['csv-to-json "name,value\\nA,1"']
})

registerCommand('encode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔐 编码工具',
          '',
          '用法: encode <类型> <文本>',
          '',
          '支持类型:',
          '  base64     - Base64编码',
          '  url        - URL编码',
          '  url-safe   - URL安全Base64',
          '  html       - HTML实体编码',
          '',
          '示例:',
          '  encode base64 Hello World',
          '  encode url Hello World!',
          '  encode html <script>alert(1)</script>',
        ].join('\n')
      }
    }
    
    const type = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    let result: string
    
    switch (type) {
      case 'base64':
        result = btoa(text)
        break
      case 'url':
        result = encodeURIComponent(text)
        break
      case 'url-safe':
        result = btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        break
      case 'html': {
        const div = document.createElement('div')
        div.textContent = text
        result = div.innerHTML
        break
      }
      default:
        return { output: `encode: 不支持的编码类型 '${type}'` }
    }
    
    return {
      output: [
        '🔐 编码结果',
        '',
        `类型: ${type}`,
        `原文: ${text}`,
        `编码: ${result}`,
      ].join('\n')
    }
  },
  description: '多格式编码工具',
  usage: 'encode <类型> <文本>',
  examples: ['encode base64 Hello', 'encode url Hello!']
})

registerCommand('decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔓 解码工具',
          '',
          '用法: decode <类型> <编码文本>',
          '',
          '支持类型:',
          '  base64     - Base64解码',
          '  url        - URL解码',
          '  url-safe   - URL安全Base64解码',
          '  html       - HTML实体解码',
          '',
          '示例:',
          '  decode base64 SGVsbG8gV29ybGQ=',
          '  decode url Hello%20World',
        ].join('\n')
      }
    }
    
    const type = args[0].toLowerCase()
    const encoded = args.slice(1).join(' ')
    
    try {
      let result: string
      
      switch (type) {
        case 'base64':
          result = atob(encoded)
          break
        case 'url':
          result = decodeURIComponent(encoded)
          break
        case 'url-safe': {
          const padded = encoded.padEnd(encoded.length + (4 - encoded.length % 4) % 4, '=')
          result = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
          break
        }
        case 'html': {
          const div = document.createElement('div')
          div.innerHTML = encoded
          result = div.textContent || ''
          break
        }
        default:
          return { output: `decode: 不支持的解码类型 '${type}'` }
      }
      
      return {
        output: [
          '🔓 解码结果',
          '',
          `类型: ${type}`,
          `编码: ${encoded}`,
          `原文: ${result}`,
        ].join('\n')
      }
    } catch (e) {
      return { output: `decode: 解码失败 - ${(e as Error).message}` }
    }
  },
  description: '多格式解码工具',
  usage: 'decode <类型> <编码文本>',
  examples: ['decode base64 SGVsbG8=', 'decode url Hello%20World']
})

registerCommand('converter', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 3) {
      return {
        output: [
          '🔢 单位转换器',
          '',
          '用法: converter <数值> <源单位> <目标单位>',
          '',
          '支持转换:',
          '  长度: m, km, cm, mm, inch, ft, yard, mile',
          '  重量: kg, g, mg, lb, oz',
          '  温度: c, f, k',
          '  面积: m2, km2, acre, hectare',
          '  体积: l, ml, gal, qt, pt',
          '',
          '示例:',
          '  converter 10 km mile',
          '  converter 25 c f',
          '  converter 100 kg lb',
        ].join('\n')
      }
    }
    
    const value = parseFloat(args[0])
    const from = args[1].toLowerCase()
    const to = args[2].toLowerCase()
    
    if (isNaN(value)) {
      return { output: 'converter: 无效的数值' }
    }
    
    const toBase: Record<string, Record<string, (v: number) => number>> = {
      length: {
        m: (v) => v,
        km: (v) => v * 1000,
        cm: (v) => v / 100,
        mm: (v) => v / 1000,
        inch: (v) => v / 39.3701,
        ft: (v) => v / 3.28084,
        yard: (v) => v / 1.09361,
        mile: (v) => v * 1609.34,
      },
      weight: {
        kg: (v) => v,
        g: (v) => v / 1000,
        mg: (v) => v / 1000000,
        lb: (v) => v * 0.453592,
        oz: (v) => v * 0.0283495,
      },
      temperature: {
        c: (v) => v,
        f: (v) => (v - 32) * 5 / 9,
        k: (v) => v - 273.15,
      },
      area: {
        m2: (v) => v,
        km2: (v) => v * 1000000,
        acre: (v) => v * 4046.86,
        hectare: (v) => v * 10000,
      },
      volume: {
        l: (v) => v,
        ml: (v) => v / 1000,
        gal: (v) => v * 3.78541,
        qt: (v) => v * 0.946353,
        pt: (v) => v * 0.473176,
      },
    }
    
    const fromBase: Record<string, Record<string, (v: number) => number>> = {
      length: {
        m: (v) => v,
        km: (v) => v / 1000,
        cm: (v) => v * 100,
        mm: (v) => v * 1000,
        inch: (v) => v * 39.3701,
        ft: (v) => v * 3.28084,
        yard: (v) => v * 1.09361,
        mile: (v) => v / 1609.34,
      },
      weight: {
        kg: (v) => v,
        g: (v) => v * 1000,
        mg: (v) => v * 1000000,
        lb: (v) => v / 0.453592,
        oz: (v) => v / 0.0283495,
      },
      temperature: {
        c: (v) => v,
        f: (v) => v * 9 / 5 + 32,
        k: (v) => v + 273.15,
      },
      area: {
        m2: (v) => v,
        km2: (v) => v / 1000000,
        acre: (v) => v / 4046.86,
        hectare: (v) => v / 10000,
      },
      volume: {
        l: (v) => v,
        ml: (v) => v * 1000,
        gal: (v) => v / 3.78541,
        qt: (v) => v / 0.946353,
        pt: (v) => v / 0.473176,
      },
    }
    
    const lengthUnits = new Set(['m', 'km', 'cm', 'mm', 'inch', 'ft', 'yard', 'mile'])
    const weightUnits = new Set(['kg', 'g', 'mg', 'lb', 'oz'])
    const tempUnits = new Set(['c', 'f', 'k'])
    const areaUnits = new Set(['m2', 'km2', 'acre', 'hectare'])
    const volumeUnits = new Set(['l', 'ml', 'gal', 'qt', 'pt'])
    
    let category: string | null = null
    
    if (lengthUnits.has(from) && lengthUnits.has(to)) category = 'length'
    else if (weightUnits.has(from) && weightUnits.has(to)) category = 'weight'
    else if (tempUnits.has(from) && tempUnits.has(to)) category = 'temperature'
    else if (areaUnits.has(from) && areaUnits.has(to)) category = 'area'
    else if (volumeUnits.has(from) && volumeUnits.has(to)) category = 'volume'
    
    if (!category) {
      return { output: 'converter: 不支持的单位转换' }
    }
    
    const baseValue = toBase[category][from](value)
    const result = fromBase[category][to](baseValue)
    
    const unitNames: Record<string, string> = {
      m: '米', km: '千米', cm: '厘米', mm: '毫米',
      inch: '英寸', ft: '英尺', yard: '码', mile: '英里',
      kg: '千克', g: '克', mg: '毫克', lb: '磅', oz: '盎司',
      c: '摄氏度', f: '华氏度', k: '开尔文',
      m2: '平方米', km2: '平方千米', acre: '英亩', hectare: '公顷',
      l: '升', ml: '毫升', gal: '加仑', qt: '夸脱', pt: '品脱',
    }
    
    return {
      output: [
        '🔢 单位转换',
        '',
        `${value} ${unitNames[from] || from} = ${result.toFixed(4)} ${unitNames[to] || to}`,
      ].join('\n')
    }
  },
  description: '单位转换器',
  usage: 'converter <数值> <源单位> <目标单位>',
  examples: ['converter 10 km mile', 'converter 25 c f']
})

registerCommand('markdown', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📝 Markdown快速参考',
          '',
          '标题:',
          '  # 一级标题',
          '  ## 二级标题',
          '  ### 三级标题',
          '',
          '文本样式:',
          '  **粗体**  *斜体*  ~~删除线~~',
          '  `行内代码`  [链接](url)',
          '',
          '列表:',
          '  - 无序列表',
          '  1. 有序列表',
          '',
          '引用:',
          '  > 引用文本',
          '',
          '代码块:',
          '  ```javascript',
          '  console.log("hello");',
          '  ```',
          '',
          '表格:',
          '  | 列1 | 列2 |',
          '  | --- | --- |',
          '  | 内容 | 内容 |',
        ].join('\n')
      }
    }
    
    return {
      output: [
        '📝 Markdown快速参考',
        '',
        '用法: markdown 查看语法参考',
        '',
        '提示: 使用代码编辑器或Markdown应用编辑.md文件',
      ].join('\n')
    }
  },
  description: 'Markdown语法参考',
  usage: 'markdown',
  examples: ['markdown']
})

registerCommand('css-reference', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🎨 CSS快速参考',
          '',
          '布局:',
          '  display: flex | grid | block | inline',
          '  flex-direction: row | column',
          '  justify-content: center | space-between',
          '  align-items: center | stretch',
          '',
          '定位:',
          '  position: relative | absolute | fixed',
          '  top, right, bottom, left',
          '',
          '边框:',
          '  border: 1px solid #ccc',
          '  border-radius: 4px',
          '',
          '间距:',
          '  margin: 10px',
          '  padding: 10px',
          '',
          '颜色:',
          '  color: #fff',
          '  background: #000',
          '',
          '字体:',
          '  font-size: 14px',
          '  font-family: Arial, sans-serif',
          '',
          '动画:',
          '  transition: all 0.3s',
          '  animation: name duration',
        ].join('\n')
      }
    }
    
    return {
      output: [
        '🎨 CSS快速参考',
        '',
        '提示: 使用代码编辑器编辑CSS文件',
      ].join('\n')
    }
  },
  description: 'CSS语法参考',
  usage: 'css-reference',
  examples: ['css-reference']
})

registerCommand('js-reference', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📜 JavaScript快速参考',
          '',
          '变量:',
          '  const x = 10',
          '  let y = "hello"',
          '',
          '函数:',
          '  function fn() {}',
          '  const fn = () => {}',
          '',
          '数组:',
          '  const arr = [1, 2, 3]',
          '  arr.map(x => x * 2)',
          '  arr.filter(x => x > 1)',
          '',
          '对象:',
          '  const obj = { a: 1, b: 2 }',
          '  const { a } = obj',
          '',
          'Promise:',
          '  async function fn() {',
          '    const result = await fetch(url)',
          '  }',
          '',
          '箭头函数:',
          '  arr.forEach(item => console.log(item))',
          '',
          '模板字符串:',
          '  `Hello ${name}`',
        ].join('\n')
      }
    }
    
    return {
      output: [
        '📜 JavaScript快速参考',
        '',
        '提示: 使用代码编辑器编辑JS文件',
      ].join('\n')
    }
  },
  description: 'JavaScript语法参考',
  usage: 'js-reference',
  examples: ['js-reference']
})