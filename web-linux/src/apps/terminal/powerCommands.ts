import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath } from '../../store'
import { API_CONFIG, fetchWithTimeout } from '../../config/apiConfig'

registerCommand('gzip', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, updateFileContent } = context
    
    if (args.length === 0) {
      return { output: 'gzip: 缺少操作数\n用法: gzip <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `gzip: ${args[0]}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const compressed = btoa(content)
    const originalSize = content.length
    const compressedSize = compressed.length
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)
    
    if (updateFileContent) {
      updateFileContent(node.id, compressed)
    }
    
    return {
      output: [
        `压缩 ${args[0]}`,
        `原始大小: ${originalSize} 字节`,
        `压缩大小: ${compressedSize} 字节`,
        `压缩率: ${ratio}%`,
        '(注: 使用 gunzip 命令解压)',
      ].join('\n')
    }
  },
  description: '压缩文件（Base64编码方式模拟）',
  usage: 'gzip <文件>',
  examples: ['gzip file.txt']
})

registerCommand('gunzip', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, updateFileContent } = context
    
    if (args.length === 0) {
      return { output: 'gunzip: 缺少操作数\n用法: gunzip <压缩文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `gunzip: ${args[0]}: 没有那个文件或目录` }
    }
    
    try {
      const compressed = node.content || ''
      const decompressed = atob(compressed)
      
      if (updateFileContent) {
        updateFileContent(node.id, decompressed)
      }
      
      return { output: `已解压 ${args[0]}` }
    } catch {
      return { output: `gunzip: ${args[0]}: 无效的压缩文件` }
    }
  },
  description: '解压文件',
  usage: 'gunzip <压缩文件>',
  examples: ['gunzip file.txt']
})

registerCommand('file', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'file: 缺少操作数\n用法: file <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node) {
      return { output: `file: ${args[0]}: 没有那个文件或目录` }
    }
    
    if (node.type === 'folder') {
      return { output: `${args[0]}: directory` }
    }
    
    const name = node.name.toLowerCase()
    const ext = name.includes('.') ? name.split('.').pop() || '' : ''
    
    const typeMap: Record<string, string> = {
      'txt': 'ASCII text',
      'md': 'Markdown text document',
      'json': 'JSON data',
      'js': 'JavaScript source',
      'ts': 'TypeScript source',
      'tsx': 'TypeScript JSX source',
      'jsx': 'JavaScript JSX source',
      'html': 'HTML document',
      'css': 'CSS stylesheet',
      'py': 'Python source',
      'sh': 'Bourne shell script',
      'xml': 'XML document',
      'yaml': 'YAML document',
      'yml': 'YAML document',
      'csv': 'CSV spreadsheet',
      'log': 'Log file',
      'png': 'PNG image data',
      'jpg': 'JPEG image data',
      'jpeg': 'JPEG image data',
      'gif': 'GIF image data',
      'svg': 'SVG vector image',
      'webp': 'WebP image data',
      'mp3': 'MPEG audio',
      'wav': 'WAVE audio',
      'mp4': 'MPEG-4 video',
      'webm': 'WebM video',
      'pdf': 'PDF document',
      'zip': 'Zip archive',
      'tar': 'Tar archive',
      'gz': 'Gzip compressed data',
    }
    
    const fileType = typeMap[ext] || 'data'
    const size = (node.content || '').length
    
    return { output: `${args[0]}: ${fileType} (${size} bytes)` }
  },
  description: '识别文件类型',
  usage: 'file <文件>',
  examples: ['file document.txt', 'file image.png']
})

registerCommand('cut', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: 'cut: 缺少操作数\n用法: cut -f <字段> -d <分隔符> <文件>' }
    }
    
    const fieldIndex = args.indexOf('-f')
    const delimiterIndex = args.indexOf('-d')
    
    if (fieldIndex === -1 || delimiterIndex === -1) {
      return { output: 'cut: 需要 -f 和 -d 参数' }
    }
    
    const field = parseInt(args[fieldIndex + 1]) || 1
    const delimiter = args[delimiterIndex + 1] || ','
    
    const fileArg = args.find(a => !a.startsWith('-'))
    if (!fileArg) {
      return { output: 'cut: 缺少文件参数' }
    }
    
    const resolved = resolvePath(cwd, fileArg)
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `cut: ${fileArg}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n')
    const result = lines
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split(delimiter)
        return parts[field - 1] || ''
      })
      .join('\n')
    
    return { output: result }
  },
  description: '提取文件中的指定字段',
  usage: 'cut -f <字段> -d <分隔符> <文件>',
  examples: ['cut -f 1 -d "," data.csv']
})

registerCommand('paste', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: 'paste: 缺少操作数\n用法: paste <文件1> <文件2>' }
    }
    
    const file1 = resolvePath(cwd, args[0])
    const file2 = resolvePath(cwd, args[1])
    
    const node1 = findNodeByPath(files, file1)
    const node2 = findNodeByPath(files, file2)
    
    if (!node1 || node1.type !== 'file') {
      return { output: `paste: ${args[0]}: 没有那个文件或目录` }
    }
    if (!node2 || node2.type !== 'file') {
      return { output: `paste: ${args[1]}: 没有那个文件或目录` }
    }
    
    const lines1 = (node1.content || '').split('\n')
    const lines2 = (node2.content || '').split('\n')
    const maxLen = Math.max(lines1.length, lines2.length)
    
    const result: string[] = []
    for (let i = 0; i < maxLen; i++) {
      result.push(`${lines1[i] || ''}\t${lines2[i] || ''}`)
    }
    
    return { output: result.join('\n') }
  },
  description: '合并两个文件的内容',
  usage: 'paste <文件1> <文件2>',
  examples: ['paste col1.txt col2.txt']
})

registerCommand('nl', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'nl: 缺少操作数\n用法: nl <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `nl: ${args[0]}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n')
    const result = lines.map((line, i) => `${(i + 1).toString().padStart(6)}  ${line}`).join('\n')
    
    return { output: result }
  },
  description: '显示文件并添加行号',
  usage: 'nl <文件>',
  examples: ['nl file.txt']
})

registerCommand('expand', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, updateFileContent } = context
    
    if (args.length === 0) {
      return { output: 'expand: 缺少操作数\n用法: expand <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `expand: ${args[0]}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const expanded = content.replace(/\t/g, '        ')
    
    if (updateFileContent) {
      updateFileContent(node.id, expanded)
    }
    
    return { output: `已将制表符转换为空格` }
  },
  description: '将制表符转换为空格',
  usage: 'expand <文件>',
  examples: ['expand file.txt']
})

registerCommand('tr', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, updateFileContent } = context
    
    if (args.length < 3) {
      return { output: 'tr: 缺少操作数\n用法: tr <字符集1> <字符集2> <文件>' }
    }
    
    const set1 = args[0]
    const set2 = args[1]
    const fileArg = args[2]
    
    const resolved = resolvePath(cwd, fileArg)
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `tr: ${fileArg}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const translationMap: Record<string, string> = {}
    for (let i = 0; i < set1.length; i++) {
      translationMap[set1[i]] = set2[i % set2.length] || set2[set2.length - 1]
    }
    
    const result = content.split('').map(c => translationMap[c] || c).join('')
    
    if (updateFileContent) {
      updateFileContent(node.id, result)
    }
    
    return { output: '字符替换完成' }
  },
  description: '字符替换',
  usage: 'tr <字符集1> <字符集2> <文件>',
  examples: ['tr abc ABC file.txt', 'tr a-z A-Z file.txt']
})

registerCommand('split', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile, updateFileContent } = context
    
    if (args.length < 2) {
      return { output: 'split: 缺少操作数\n用法: split -l <行数> <文件>' }
    }
    
    const lineIndex = args.indexOf('-l')
    if (lineIndex === -1) {
      return { output: 'split: 需要 -l 参数指定行数' }
    }
    
    const linesPerFile = parseInt(args[lineIndex + 1]) || 10
    const fileArg = args.find(a => !a.startsWith('-'))
    
    if (!fileArg) {
      return { output: 'split: 缺少文件参数' }
    }
    
    const resolved = resolvePath(cwd, fileArg)
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `split: ${fileArg}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n')
    const parentPath = resolved.substring(0, resolved.lastIndexOf('/')) || '/'
    const fileName = resolved.substring(resolved.lastIndexOf('/') + 1)
    const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName
    
    let fileNum = 0
    for (let i = 0; i < lines.length; i += linesPerFile) {
      const chunk = lines.slice(i, i + linesPerFile).join('\n')
      const chunkName = `${baseName}.${String(fileNum).padStart(2, '0')}`
      
      if (addFile) {
        const parent = findNodeByPath(files, parentPath)
        if (parent && parent.type === 'folder') {
          addFile(parent.id, chunkName, 'file')
          setTimeout(() => {
            const newFile = findNodeByPath(files, `${parentPath}/${chunkName}`)
            if (newFile && updateFileContent) {
              updateFileContent(newFile.id, chunk)
            }
          }, 50)
        }
      }
      fileNum++
    }
    
    return { output: `已分割为 ${fileNum} 个文件` }
  },
  description: '按行数分割文件',
  usage: 'split -l <行数> <文件>',
  examples: ['split -l 100 largefile.txt']
})

registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const now = new Date()
    const timestamp = Math.floor(now.getTime() / 1000)
    
    if (args.length > 0) {
      const input = args[0]
      if (!isNaN(Number(input))) {
        const ts = parseInt(input) * 1000
        const date = new Date(ts)
        return {
          output: [
            `时间戳: ${input}`,
            `日期: ${date.toLocaleString('zh-CN')}`,
            `UTC: ${date.toISOString()}`,
          ].join('\n')
        }
      }
    }
    
    return {
      output: [
        `当前时间: ${now.toLocaleString('zh-CN')}`,
        `Unix时间戳: ${timestamp}`,
        `毫秒时间戳: ${now.getTime()}`,
        `ISO格式: ${now.toISOString()}`,
      ].join('\n')
    }
  },
  description: '显示或转换时间戳',
  usage: 'timestamp [时间戳]',
  examples: ['timestamp', 'timestamp 1672531200']
})

registerCommand('uuidv4', {
  handler: (): CommandResult => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    
    return { output: uuid }
  },
  description: '生成UUIDv4',
  usage: 'uuidv4',
  examples: ['uuidv4']
})

registerCommand('password-strength', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'password-strength: 缺少密码\n用法: password-strength <密码>' }
    }
    
    const password = args.join(' ')
    let score = 0
    const feedback: string[] = []
    
    if (password.length >= 8) score++
    else feedback.push('密码长度应至少8位')
    
    if (password.length >= 12) score++
    else feedback.push('密码长度建议12位以上')
    
    if (/[a-z]/.test(password)) score++
    else feedback.push('应包含小写字母')
    
    if (/[A-Z]/.test(password)) score++
    else feedback.push('应包含大写字母')
    
    if (/[0-9]/.test(password)) score++
    else feedback.push('应包含数字')
    
    if (/[^a-zA-Z0-9]/.test(password)) score++
    else feedback.push('应包含特殊字符')
    
    const strength = score >= 5 ? '强' : score >= 3 ? '中等' : '弱'
    const color = score >= 5 ? '🟢' : score >= 3 ? '🟡' : '🔴'
    
    return {
      output: [
        `密码强度: ${color} ${strength}`,
        `评分: ${score}/6`,
        '',
        ...(feedback.length > 0 ? ['改进建议:', ...feedback.map(f => `  • ${f}`)] : ['密码强度良好！'])
      ].join('\n')
    }
  },
  description: '检测密码强度',
  usage: 'password-strength <密码>',
  examples: ['password-strength mypassword123']
})

registerCommand('regex-test', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return { output: 'regex-test: 缺少参数\n用法: regex-test <模式> <文本>' }
    }
    
    const pattern = args[0]
    const text = args.slice(1).join(' ')
    
    try {
      const regex = new RegExp(pattern)
      const match = regex.test(text)
      const matches = text.match(regex) || []
      
      return {
        output: [
          `模式: ${pattern}`,
          `文本: ${text}`,
          '',
          `匹配结果: ${match ? '✅ 匹配' : '❌ 不匹配'}`,
          ...(matches.length > 0 ? [`找到 ${matches.length} 个匹配:`, ...matches.map(m => `  • ${m}`)] : [])
        ].join('\n')
      }
    } catch (e) {
      return { output: `regex-test: 无效的正则表达式 - ${(e as Error).message}` }
    }
  },
  description: '测试正则表达式',
  usage: 'regex-test <模式> <文本>',
  examples: ['regex-test "hello" "Hello World"', 'regex-test "^\\d+$" "12345"']
})

registerCommand('base64-url', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'base64-url: 缺少参数\n用法: base64-url <文本>' }
    }
    
    const text = args.join(' ')
    const encoded = btoa(text)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    return { output: encoded }
  },
  description: 'URL安全Base64编码',
  usage: 'base64-url <文本>',
  examples: ['base64-url Hello World']
})

registerCommand('cron-parse', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'cron-parse: 缺少参数\n用法: cron-parse <表达式>' }
    }
    
    const expr = args.join(' ')
    const parts = expr.split(' ')
    
    if (parts.length !== 5) {
      return { output: 'cron-parse: 无效的表达式格式（应为5个字段）' }
    }
    
    const [minute, hour, day, month, weekday] = parts
    
    const getDesc = (field: string, type: string): string => {
      if (field === '*') return `每${type}`
      if (field.includes('-')) {
        const [start, end] = field.split('-')
        return `${type} ${start}-${end}`
      }
      if (field.includes(',')) {
        return `${type} ${field}`
      }
      if (field.includes('/')) {
        const [, step] = field.split('/')
        return `每${step}${type}`
      }
      return `${type} ${field}`
    }
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    const monthDesc = month === '*' ? '每月' : monthNames[parseInt(month) - 1] || month
    const weekdayDesc = weekday === '*' ? '每天' : weekdayNames[parseInt(weekday)] || weekday
    
    return {
      output: [
        `Cron表达式: ${expr}`,
        '',
        `分钟: ${getDesc(minute, '分钟')}`,
        `小时: ${getDesc(hour, '小时')}`,
        `日期: ${getDesc(day, '日')}`,
        `月份: ${monthDesc}`,
        `星期: ${weekdayDesc}`,
      ].join('\n')
    }
  },
  description: '解析Cron表达式',
  usage: 'cron-parse <表达式>',
  examples: ['cron-parse "0 9 * * 1-5"', 'cron-parse "*/5 * * * *"']
})

registerCommand('url-info', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'url-info: 缺少参数\n用法: url-info <URL>' }
    }
    
    const url = args.join(' ')
    
    try {
      const parsed = new URL(url)
      
      return {
        output: [
          `URL: ${url}`,
          '',
          `协议: ${parsed.protocol}`,
          `主机: ${parsed.hostname}`,
          `端口: ${parsed.port || '默认'}`,
          `路径: ${parsed.pathname}`,
          `查询: ${parsed.search || '无'}`,
          `哈希: ${parsed.hash || '无'}`,
        ].join('\n')
      }
    } catch (e) {
      return { output: `url-info: 无效的URL - ${(e as Error).message}` }
    }
  },
  description: '解析URL信息',
  usage: 'url-info <URL>',
  examples: ['url-info https://github.com/saya-ch/WebLinuxOS']
})

registerCommand('converter', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 3) {
      return {
        output: [
          '单位转换器',
          '',
          '用法: converter <数值> <源单位> <目标单位>',
          '',
          '支持的单位:',
          '  长度: m, km, cm, mm, inch, ft, yard, mile',
          '  重量: kg, g, mg, lb, oz',
          '  温度: c, f, k',
          '  面积: m2, km2, cm2, acre, hectare',
          '',
          '示例:',
          '  converter 100 km mile',
          '  converter 25 c f',
          '  converter 10 kg lb',
        ].join('\n')
      }
    }
    
    const value = parseFloat(args[0])
    const from = args[1].toLowerCase()
    const to = args[2].toLowerCase()
    
    if (isNaN(value)) {
      return { output: 'converter: 无效的数值' }
    }
    
    const conversions: Record<string, Record<string, number>> = {
      'm': { 'km': 0.001, 'cm': 100, 'mm': 1000, 'inch': 39.3701, 'ft': 3.28084, 'yard': 1.09361, 'mile': 0.000621371 },
      'km': { 'm': 1000, 'cm': 100000, 'mm': 1000000, 'inch': 39370.1, 'ft': 3280.84, 'yard': 1093.61, 'mile': 0.621371 },
      'cm': { 'm': 0.01, 'km': 0.00001, 'mm': 10, 'inch': 0.393701, 'ft': 0.0328084, 'yard': 0.0109361, 'mile': 0.00000621371 },
      'mm': { 'm': 0.001, 'km': 0.000001, 'cm': 0.1, 'inch': 0.0393701, 'ft': 0.00328084, 'yard': 0.00109361, 'mile': 0.000000621371 },
      'inch': { 'm': 0.0254, 'km': 0.0000254, 'cm': 2.54, 'mm': 25.4, 'ft': 0.0833333, 'yard': 0.0277778, 'mile': 0.0000157828 },
      'ft': { 'm': 0.3048, 'km': 0.0003048, 'cm': 30.48, 'mm': 304.8, 'inch': 12, 'yard': 0.333333, 'mile': 0.000189394 },
      'yard': { 'm': 0.9144, 'km': 0.0009144, 'cm': 91.44, 'mm': 914.4, 'inch': 36, 'ft': 3, 'mile': 0.000568182 },
      'mile': { 'm': 1609.34, 'km': 1.60934, 'cm': 160934, 'mm': 1609340, 'inch': 63360, 'ft': 5280, 'yard': 1760 },
      'kg': { 'g': 1000, 'mg': 1000000, 'lb': 2.20462, 'oz': 35.274 },
      'g': { 'kg': 0.001, 'mg': 1000, 'lb': 0.00220462, 'oz': 0.035274 },
      'mg': { 'kg': 0.000001, 'g': 0.001, 'lb': 0.00000220462, 'oz': 0.000035274 },
      'lb': { 'kg': 0.453592, 'g': 453.592, 'mg': 453592, 'oz': 16 },
      'oz': { 'kg': 0.0283495, 'g': 28.3495, 'mg': 28349.5, 'lb': 0.0625 },
      'm2': { 'km2': 0.000001, 'cm2': 10000, 'acre': 0.000247105, 'hectare': 0.0001 },
      'km2': { 'm2': 1000000, 'cm2': 10000000000, 'acre': 247.105, 'hectare': 100 },
      'cm2': { 'm2': 0.0001, 'km2': 0.0000000001, 'acre': 0.0000000247105, 'hectare': 0.00000001 },
      'acre': { 'm2': 4046.86, 'km2': 0.00404686, 'cm2': 40468600, 'hectare': 0.404686 },
      'hectare': { 'm2': 10000, 'km2': 0.01, 'cm2': 100000000, 'acre': 2.47105 },
    }
    
    const tempConversions: Record<string, Record<string, (v: number) => number>> = {
      'c': { 'f': v => v * 9/5 + 32, 'k': v => v + 273.15 },
      'f': { 'c': v => (v - 32) * 5/9, 'k': v => (v - 32) * 5/9 + 273.15 },
      'k': { 'c': v => v - 273.15, 'f': v => (v - 273.15) * 9/5 + 32 },
    }
    
    if (tempConversions[from] && tempConversions[from][to]) {
      const result = tempConversions[from][to](value)
      return { output: `${value} ${from.toUpperCase()} = ${result.toFixed(4)} ${to.toUpperCase()}` }
    }
    
    if (conversions[from] && conversions[from][to]) {
      const result = value * conversions[from][to]
      return { output: `${value} ${from} = ${result.toFixed(4)} ${to}` }
    }
    
    return { output: `converter: 不支持从 ${from} 转换到 ${to}` }
  },
  description: '单位转换器',
  usage: 'converter <数值> <源单位> <目标单位>',
  examples: ['converter 100 km mile', 'converter 25 c f']
})

registerCommand('ascii-table', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          'ASCII 对照表',
          '',
          '控制字符 (0-31):',
          '  0: NUL  7: BEL  8: BS   9: TAB  10: LF  13: CR',
          '',
          '常用字符:',
          '  32: 空格  48: 0  65: A  97: a',
          '',
          '用法: ascii-table <字符> 查看特定字符的ASCII码',
        ].join('\n')
      }
    }
    
    const char = args[0][0]
    const code = char.charCodeAt(0)
    
    return {
      output: [
        `字符: '${char}'`,
        `ASCII码: ${code}`,
        `十六进制: 0x${code.toString(16).toUpperCase()}`,
        `二进制: ${code.toString(2).padStart(8, '0')}`,
      ].join('\n')
    }
  },
  description: 'ASCII码对照表',
  usage: 'ascii-table [字符]',
  examples: ['ascii-table', 'ascii-table A']
})

registerCommand('fortune', {
  handler: async (): Promise<CommandResult> => {
    const fortunes = [
      '成功的秘诀在于始终如一地坚持目标。',
      '知识是心灵的眼睛。',
      '行动是治愈恐惧的良药。',
      '成功不是终点，失败也不是致命的。重要的是继续前进的勇气。',
      '每一天都是一个新的机会。',
      '做你自己，因为别人已经有人做了。',
      '生活不是等待风暴过去，而是学会在雨中跳舞。',
      '唯一不可能的事情是你不去尝试。',
      '成功的人找方法，失败的人找借口。',
      '未来属于那些相信梦想之美的人。',
      '计算机科学中只有两件难事：缓存失效和命名。',
      '代码永远是最好的文档。',
      '简单比复杂更难。',
      '过早的优化是万恶之源。',
      '不要重复自己。',
    ]
    
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)]
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.quotable.baseUrl}/random`)
      if (response.ok) {
        const data = await response.json()
        return {
          output: [
            `「${data.content || fortune}」`,
            '',
            `—— ${data.author || '佚名'}`,
          ].join('\n')
        }
      }
    } catch {
    }
    
    return {
      output: [
        `「${fortune}」`,
        '',
        '—— 佚名',
      ].join('\n')
    }
  },
  description: '随机名言',
  usage: 'fortune',
  examples: ['fortune']
})

registerCommand('banner', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'banner: 缺少参数\n用法: banner <文本>' }
    }
    
    const text = args.join(' ').toUpperCase()
    
    const charMap: Record<string, string[]> = {
      'A': ['  A  ', ' A A ', 'AAAAA', 'A   A', 'A   A'],
      'B': ['BBBB ', 'B   B', 'BBBB ', 'B   B', 'BBBB '],
      'C': ['CCCC ', 'C    ', 'C    ', 'C    ', 'CCCC '],
      'D': ['DDDD ', 'D   D', 'D   D', 'D   D', 'DDDD '],
      'E': ['EEEEE', 'E    ', 'EEEE ', 'E    ', 'EEEEE'],
      'F': ['FFFFF', 'F    ', 'FFFF ', 'F    ', 'F    '],
      'G': ['GGGG ', 'G    ', 'G GG ', 'G   G', 'GGGG '],
      'H': ['H   H', 'H   H', 'HHHHH', 'H   H', 'H   H'],
      'I': ['IIIII', '  I  ', '  I  ', '  I  ', 'IIIII'],
      'J': ['JJJJJ', '    J', '    J', 'J   J', 'JJJJ '],
      'K': ['K   K', 'K  K ', 'KK   ', 'K  K ', 'K   K'],
      'L': ['L    ', 'L    ', 'L    ', 'L    ', 'LLLLL'],
      'M': ['M   M', 'MM MM', 'M M M', 'M   M', 'M   M'],
      'N': ['N   N', 'NN  N', 'N N N', 'N  NN', 'N   N'],
      'O': ['OOOOO', 'O   O', 'O   O', 'O   O', 'OOOOO'],
      'P': ['PPPP ', 'P   P', 'PPPP ', 'P    ', 'P    '],
      'Q': ['QQQQQ', 'Q   Q', 'Q Q Q', 'Q  QQ', 'QQ QQ'],
      'R': ['RRRR ', 'R   R', 'RRRR ', 'R R R', 'R   R'],
      'S': ['SSSSS', 'S    ', 'SSSS ', '    S', 'SSSSS'],
      'T': ['TTTTT', '  T  ', '  T  ', '  T  ', '  T  '],
      'U': ['U   U', 'U   U', 'U   U', 'U   U', 'UUUUU'],
      'V': ['V   V', 'V   V', 'V   V', ' V V ', '  V  '],
      'W': ['W   W', 'W   W', 'W W W', 'WW WW', 'W   W'],
      'X': ['X   X', ' X X ', '  X  ', ' X X ', 'X   X'],
      'Y': ['Y   Y', ' Y Y ', '  Y  ', '  Y  ', '  Y  '],
      'Z': ['ZZZZZ', '    Z', '   Z ', '  Z  ', 'ZZZZZ'],
      '0': ['OOOOO', 'O   O', 'O   O', 'O   O', 'OOOOO'],
      '1': ['  1  ', ' 11  ', '  1  ', '  1  ', '11111'],
      '2': ['22222', '    2', '22222', '2    ', '22222'],
      '3': ['33333', '    3', '33333', '    3', '33333'],
      '4': ['4   4', '4   4', '44444', '    4', '    4'],
      '5': ['55555', '5    ', '55555', '    5', '55555'],
      '6': ['66666', '6    ', '66666', '6   6', '66666'],
      '7': ['77777', '    7', '   7 ', '  7  ', ' 7   '],
      '8': ['88888', '8   8', '88888', '8   8', '88888'],
      '9': ['99999', '9   9', '99999', '    9', '99999'],
      ' ': ['     ', '     ', '     ', '     ', '     '],
    }
    
    const lines: string[] = []
    for (let i = 0; i < 5; i++) {
      let line = ''
      for (const char of text) {
        line += (charMap[char]?.[i] || '     ') + ' '
      }
      lines.push(line)
    }
    
    return { output: lines.join('\n') }
  },
  description: '生成大字标题',
  usage: 'banner <文本>',
  examples: ['banner HELLO', 'banner WebLinuxOS']
})

registerCommand('cowsay', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const text = args.length > 0 ? args.join(' ') : 'Hello, WebLinuxOS!'
    
    const cow = [
      `  ${'"' + text + '"'}`,
      '        \\   ^__^',
      '         \\  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ]
    
    return { output: cow.join('\n') }
  },
  description: 'ASCII牛说话',
  usage: 'cowsay <文本>',
  examples: ['cowsay Hello World']
})

registerCommand('cowthink', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const text = args.length > 0 ? args.join(' ') : 'Hmm... thinking about WebLinuxOS...'
    
    const cow = [
      `  ${'(' + text + ')'}`,
      '        o   ^__^',
      '         o  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ]
    
    return { output: cow.join('\n') }
  },
  description: 'ASCII牛思考',
  usage: 'cowthink <文本>',
  examples: ['cowthink What should I do today?']
})

registerCommand('dog', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.dogCeo.baseUrl}/breeds/image/random`)
      if (response.ok) {
        const data = await response.json()
        return {
          output: [
            '🐕 随机狗狗图片',
            '',
            `图片链接: ${data.message}`,
            '',
            '将链接复制到浏览器中打开查看',
          ].join('\n')
        }
      }
    } catch {
    }
    
    const fallbackDogs = [
      '🐕 汪汪汪！',
      '🐶 一只可爱的小狗',
      '🦮 导盲犬',
      '🐩 贵宾犬',
      '🐕‍🦺 搜救犬',
    ]
    
    return {
      output: [
        '🐕 随机狗狗',
        '',
        fallbackDogs[Math.floor(Math.random() * fallbackDogs.length)],
      ].join('\n')
    }
  },
  description: '获取随机狗狗图片',
  usage: 'dog',
  examples: ['dog']
})

registerCommand('advice', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.adviceSlip.baseUrl}/advice`)
      if (response.ok) {
        const data = await response.json()
        return {
          output: [
            '💡 每日建议',
            '',
            `${data.slip?.advice || '暂无建议'}`,
          ].join('\n')
        }
      }
    } catch {
    }
    
    const advices = [
      '今天是学习新事物的好日子。',
      '休息也是工作的一部分。',
      '保持好奇心，它是创造力的源泉。',
      '不要害怕犯错误，它们是成长的机会。',
      '与他人分享你的知识，你会学得更多。',
    ]
    
    return {
      output: [
        '💡 每日建议',
        '',
        advices[Math.floor(Math.random() * advices.length)],
      ].join('\n')
    }
  },
  description: '获取每日建议',
  usage: 'advice',
  examples: ['advice']
})

registerCommand('flip', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'flip: 缺少参数\n用法: flip <文本>' }
    }
    
    const text = args.join(' ')
    const flipMap: Record<string, string> = {
      'A': '∀', 'B': 'B', 'C': 'Ɔ', 'D': 'D', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'פ',
      'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'K', 'L': '˥', 'M': 'W', 'N': 'N',
      'O': 'O', 'P': 'Ԁ', 'Q': 'Ό', 'R': 'ᴚ', 'S': 'S', 'T': '⊥', 'U': '∩',
      'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
      'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ',
      'h': 'ɥ', 'i': 'ı', 'j': 'ɾ', 'k': 'ʞ', 'l': 'ן', 'm': 'ɯ', 'n': 'u',
      'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n',
      'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
      '0': '0', '1': '1', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9',
      '7': 'ㄥ', '8': '8', '9': '6',
      '!': '¡', '?': '¿', '"': '„', "'": ',', '.': '˙', ',': "'", '_': '‾',
    }
    
    const flipped = text.split('').map(c => flipMap[c] || c).reverse().join('')
    
    return { output: flipped }
  },
  description: '翻转文字',
  usage: 'flip <文本>',
  examples: ['flip Hello World']
})

registerCommand('rps', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const choices = ['rock', 'paper', 'scissors']
    const playerChoice = args[0]?.toLowerCase()
    
    if (!playerChoice || !choices.includes(playerChoice)) {
      return {
        output: [
          '石头剪刀布',
          '',
          '用法: rps <rock|paper|scissors>',
          '',
          '示例:',
          '  rps rock',
          '  rps paper',
          '  rps scissors',
        ].join('\n')
      }
    }
    
    const computerChoice = choices[Math.floor(Math.random() * choices.length)]
    
    let result: string
    if (playerChoice === computerChoice) {
      result = '平局！'
    } else if (
      (playerChoice === 'rock' && computerChoice === 'scissors') ||
      (playerChoice === 'paper' && computerChoice === 'rock') ||
      (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
      result = '你赢了！🎉'
    } else {
      result = '你输了！😢'
    }
    
    const emojiMap: Record<string, string> = {
      'rock': '🪨',
      'paper': '📄',
      'scissors': '✂️',
    }
    
    return {
      output: [
        '石头剪刀布',
        '',
        `你: ${emojiMap[playerChoice]} ${playerChoice}`,
        `电脑: ${emojiMap[computerChoice]} ${computerChoice}`,
        '',
        result,
      ].join('\n')
    }
  },
  description: '石头剪刀布游戏',
  usage: 'rps <rock|paper|scissors>',
  examples: ['rps rock', 'rps paper']
})

registerCommand('matrix', {
  handler: (): CommandResult => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]|;:,.<>?'
    const lines: string[] = []
    
    for (let i = 0; i < 8; i++) {
      let line = ''
      for (let j = 0; j < 20; j++) {
        line += chars[Math.floor(Math.random() * chars.length)]
      }
      lines.push(line)
    }
    
    return {
      output: [
        'MATRIX 效果',
        '',
        ...lines,
        '',
        '提示: 这是一个模拟效果',
      ].join('\n')
    }
  },
  description: '显示Matrix风格的随机字符',
  usage: 'matrix',
  examples: ['matrix']
})